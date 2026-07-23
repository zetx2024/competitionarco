document.addEventListener("DOMContentLoaded", () => {
    
    // আপনার JSON ফাইলগুলোর লিংক (এখানে আপনার আসল লিংক বসান)
    const FLAG_JSON_URL = "https://iarco.org/data/flagss.json";
    const PARTICIPANTS_JSON_URL = "https://iarco.org/data/mapp.json"; // আপনার পার্টিসিপেন্ট ডেটা লিংক

    // কিছু দেশের নাম GeoJSON ফাইলে আলাদা থাকে, সেগুলো মেলানোর জন্য ম্যাপার
    const countryNameMap = {
        "United States": "USA",
        "United Kingdom": "England"
    };

    const width = 960;
    const height = 480;
    const container = d3.select("#iarc-map-container");
    
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoMercator()
        .scale(130)
        .translate([width / 2, height / 1.5]);
    const pathGen = d3.geoPath().projection(projection);

    // একসাথে ম্যাপ, ফ্ল্যাগ এবং পার্টিসিপেন্ট ডেটা ফেচ করা
    Promise.all([
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
        fetch(FLAG_JSON_URL).then(res => res.json()).catch(() => []),
        fetch(PARTICIPANTS_JSON_URL).then(res => res.json()).catch(() => [])
    ]).then(([geoData, flagData, participantsData]) => {
        
        svg.append("g")
            .selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("d", pathGen)
            .attr("class", d => {
                const geoName = d.properties.name;
                // চেক করা হচ্ছে দেশটি পার্টিসিপেন্ট লিস্টে আছে কিনা
                const isParticipant = participantsData.find(p => {
                    const mappedName = countryNameMap[p.country] || p.country;
                    return mappedName === geoName;
                });
                return isParticipant ? "country-path active-country" : "country-path";
            })
            .attr("data-country", d => d.properties.name);

        const tooltip = document.getElementById("map-auto-tooltip");
        const mapContainerRect = document.getElementById("iarc-map-container");
        let currentIndex = 0;

        // দ্রুত টুলটিপ এনিমেশন (প্রতি 2.5 সেকেন্ড পর পর)
        setInterval(() => {
            if(participantsData.length === 0) return;
            
            const currentData = participantsData[currentIndex];
            const mappedName = countryNameMap[currentData.country] || currentData.country;
            const countryPath = document.querySelector(`path[data-country="${mappedName}"]`);
            
            if (countryPath) {
                const flagObj = flagData.find(f => f.country === currentData.country);
                const flagSvg = flagObj && flagObj.svg ? flagObj.svg : '';

                // ইয়ার এবং পার্টিসিপেন্ট কাউন্ট ক্যালকুলেট করা (Sum calculation)
                const yearsArray = Object.keys(currentData.years);
                const totalParticipants = Object.values(currentData.years).reduce((sum, val) => sum + val, 0);

                // কম্প্যাক্ট টুলটিপ লেআউট (ফ্ল্যাগ + নাম একসাথে)
                tooltip.innerHTML = `
                    <div class="tooltip-header">
                        <div class="flag-icon">${flagSvg}</div>
                        <h4>${currentData.country}</h4>
                    </div>
                    <p>Years: <span class="highlight">${yearsArray.join(', ')}</span></p>
                    <p>Total: <span class="highlight">${totalParticipants}</span></p>
                `;

                const pathRect = countryPath.getBoundingClientRect();
                const containerRect = mapContainerRect.getBoundingClientRect();
                
                const centerX = (pathRect.left + pathRect.width / 2) - containerRect.left;
                const centerY = (pathRect.top + pathRect.height / 2) - containerRect.top;

                tooltip.style.left = `${centerX}px`;
                tooltip.style.top = `${centerY - 5}px`;
                tooltip.classList.add("visible");
                
                // ২ সেকেন্ড পর টুলটিপ হাইড হবে
                setTimeout(() => {
                    tooltip.classList.remove("visible");
                }, 2000);
            }

            currentIndex = (currentIndex + 1) % participantsData.length;
        }, 2500); 
    });
});
