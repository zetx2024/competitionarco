document.addEventListener("DOMContentLoaded", async () => {
    
    const FLAG_JSON_URL = "https://iarco.org/data/flagss.json";
    const CONFIG_JSON_URL = "https://iarco.org/data/files_config.json"; 

    // জিও ম্যাপে নাম মেলানোর জন্য ম্যাপার
    const countryNameMap = {
        "United States": "USA",
        "United Kingdom": "England"
    };

    // ডেটা এগ্রিগেশন (সব ফাইল থেকে ডেটা এক করার জন্য)
    let aggregatedData = {};
    let flagData = [];
    let geoData = null;

    try {
        // ১. কনফিগারেশন, ফ্ল্যাগ এবং জিও-ডেটা ফেচ করা
        const [config, fetchedFlags, fetchedGeo] = await Promise.all([
            fetch(CONFIG_JSON_URL).then(res => res.json()),
            fetch(FLAG_JSON_URL).then(res => res.json()).catch(() => []),
            d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
        ]);

        flagData = fetchedFlags;
        geoData = fetchedGeo;

        // ২. কনফিগারেশনের সব ফাইল থেকে ডেটা ফেচ করে কাউন্ট করা
        const fetchPromises = config.map(file => 
            fetch(file.url).then(res => res.json()).then(data => {
                data.forEach(student => {
                    if (student.country) {
                        let originalName = student.country.trim();
                        let d3Name = countryNameMap[originalName] || originalName;

                        if (!aggregatedData[d3Name]) {
                            aggregatedData[d3Name] = { 
                                originalName: originalName, 
                                d3Name: d3Name, 
                                years: new Set(), 
                                total: 0 
                            };
                        }
                        aggregatedData[d3Name].years.add(file.year);
                        aggregatedData[d3Name].total += 1;
                    }
                });
            }).catch(err => console.error(`Failed to load ${file.url}`, err))
        );

        await Promise.all(fetchPromises);

    } catch (error) {
        console.error("Initialization Error:", error);
        return;
    }

    // Set থেকে Array তে কনভার্ট করা ম্যাপের লজিকের জন্য
    const finalParticipants = Object.values(aggregatedData).map(d => ({
        originalName: d.originalName,
        d3Name: d.d3Name,
        years: Array.from(d.years).sort(),
        total: d.total
    }));

    // ৩. ম্যাপ রেন্ডার করা
    const width = 960;
    const height = 480;
    const container = d3.select("#iarc-map-container");
    
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoMercator().scale(130).translate([width / 2, height / 1.5]);
    const pathGen = d3.geoPath().projection(projection);

    svg.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", pathGen)
        .attr("class", d => {
            const isParticipant = finalParticipants.find(p => p.d3Name === d.properties.name);
            return isParticipant ? "country-path active-country" : "country-path";
        })
        .attr("data-country", d => d.properties.name);

    // ৪. রেস্পন্সিভ অটো-টুলটিপ লজিক (বাউন্ডারি ফিক্স সহ)
    const tooltip = document.getElementById("map-auto-tooltip");
    const mapContainerRect = document.getElementById("iarc-map-container");
    let currentIndex = 0;

    setInterval(() => {
        if(finalParticipants.length === 0) return;
        
        const currentData = finalParticipants[currentIndex];
        const countryPath = document.querySelector(`path[data-country="${currentData.d3Name}"]`);
        
        if (countryPath) {
            const flagObj = flagData.find(f => f.country === currentData.originalName);
            const flagSvg = flagObj && flagObj.svg ? flagObj.svg : '';

            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <div class="flag-icon">${flagSvg}</div>
                    <h4>${currentData.originalName}</h4>
                </div>
                <p>Years: <span class="highlight">${currentData.years.join(', ')}</span></p>
                <p>Participants: <span class="highlight">${currentData.total}</span></p>
            `;

            // দৃশ্যমান করার পর ডাইমেনশন নেওয়া (অদৃশ্য অবস্থায় height/width 0 থাকে)
            tooltip.style.opacity = '0';
            tooltip.classList.add("visible");
            
            const tooltipRect = tooltip.getBoundingClientRect();
            const pathRect = countryPath.getBoundingClientRect();
            const containerRect = mapContainerRect.getBoundingClientRect();
            
            // সেন্টারে পজিশন ক্যালকুলেট
            let targetX = (pathRect.left + pathRect.width / 2) - containerRect.left;
            let targetY = (pathRect.top + pathRect.height / 2) - containerRect.top;

            let leftPos = targetX - (tooltipRect.width / 2);
            let topPos = targetY - tooltipRect.height - 10;

            // Boundary Detection (যাতে ফ্রেমের বাইরে না যায়)
            if (leftPos < 10) {
                leftPos = 10; // বাম দিকে বাইরে গেলে
            } else if (leftPos + tooltipRect.width > containerRect.width - 10) {
                leftPos = containerRect.width - tooltipRect.width - 10; // ডান দিকে বাইরে গেলে
            }

            if (topPos < 10) {
                topPos = targetY + 10; // উপরে বাইরে গেলে দেশের নিচে শো করবে
            }

            tooltip.style.left = `${leftPos}px`;
            tooltip.style.top = `${topPos}px`;
            tooltip.style.opacity = '1';
            
            // ২ সেকেন্ড পর হাইড
            setTimeout(() => {
                tooltip.classList.remove("visible");
            }, 2000);
        }

        currentIndex = (currentIndex + 1) % finalParticipants.length;
    }, 2500); 
});
