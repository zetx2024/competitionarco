document.addEventListener("DOMContentLoaded", async () => {
    
    const FLAG_JSON_URL = "https://iarco.org/data/flagss.json";
    const CONFIG_JSON_URL = "https://iarco.org/data/files_config.json"; 

    const countryNameMap = {
        "United States": "USA",
        "United Kingdom": "England"
    };

    let aggregatedData = {};
    let flagData = [];
    let geoData = null;

    try {
        const [config, fetchedFlags, fetchedGeo] = await Promise.all([
            fetch(CONFIG_JSON_URL).then(res => res.json()),
            fetch(FLAG_JSON_URL).then(res => res.json()).catch(() => []),
            d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
        ]);

        flagData = fetchedFlags;
        geoData = fetchedGeo;

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
        console.error("Data Fetching Error:", error);
        return;
    }

    const finalParticipants = Object.values(aggregatedData).map(d => ({
        originalName: d.originalName,
        d3Name: d.d3Name,
        years: Array.from(d.years).sort(),
        total: d.total
    }));

    const width = 960;
    const height = 500;
    const container = d3.select("#iarc-map-container");
    
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // একটি গ্রুপ (g) তৈরি করা হলো, যেন এটিকে জুম করা যায়
    const mapGroup = svg.append("g").attr("id", "map-group");

    // ম্যাপ যেন কখনোই না কাটে, তার জন্য fitSize ব্যবহার করা হয়েছে
    const projection = d3.geoMercator().fitSize([width, height], geoData);
    const pathGen = d3.geoPath().projection(projection);

    mapGroup.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", pathGen)
        .attr("class", d => {
            const isParticipant = finalParticipants.find(p => p.d3Name === d.properties.name);
            return isParticipant ? "country-path active-country" : "country-path";
        })
        .attr("data-country", d => d.properties.name);

    const tooltip = document.getElementById("map-auto-tooltip");
    const marker = document.getElementById("map-location-marker");
    let currentIndex = 0;

    // জুম অ্যানিমেশন সাইকেল
    const runAnimationCycle = () => {
        if(finalParticipants.length === 0) return;

        // ১. আগে টুলটিপ ও মার্কার হাইড করো
        tooltip.classList.remove("visible");
        marker.classList.remove("visible");

        // ২. ম্যাপ জুম আউট করে নরমাল সাইজে আনো
        mapGroup.transition()
            .duration(500)
            .attr("transform", "translate(0,0) scale(1)");

        // ৩. জুম আউট হওয়ার পর নতুন দেশের দিকে জুম ইন করো
        setTimeout(() => {
            const currentData = finalParticipants[currentIndex];
            const feature = geoData.features.find(f => f.properties.name === currentData.d3Name);

            if (feature) {
                // দেশের সেন্টার পয়েন্ট এবং সাইজ বের করা
                const centroid = pathGen.centroid(feature);
                const x = centroid[0];
                const y = centroid[1];
                const [[x0, y0], [x1, y1]] = pathGen.bounds(feature);
                
                // দেশের সাইজ অনুযায়ী ডাইনামিক জুম লেভেল (সর্বোচ্চ ৩ গুণ)
                const scale = Math.max(1, Math.min(3, 0.5 / Math.max((x1 - x0) / width, (y1 - y0) / height)));
                const translate = [width / 2 - scale * x, height / 2 - scale * y];

                // ম্যাপ জুম ইন অ্যানিমেশন
                mapGroup.transition()
                    .duration(700)
                    .attr("transform", `translate(${translate[0]},${translate[1]}) scale(${scale})`);

                // ৪. জুম ইন শেষ হলে সেন্টারে ইনফরমেশন দেখাও
                setTimeout(() => {
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

                    tooltip.classList.add("visible");
                    marker.classList.add("visible");
                }, 700); 
            }

            currentIndex = (currentIndex + 1) % finalParticipants.length;
        }, 600); // জুম আউট হওয়ার জন্য ৬০০ মি.সে. অপেক্ষা
    };

    // প্রথমবার কল করা
    setTimeout(runAnimationCycle, 1000);
    // প্রতি ৩ সেকেন্ড পর পর পুরো অ্যানিমেশন সাইকেল চলবে (অনেক দ্রুত হবে)
    setInterval(runAnimationCycle, 3000); 
});
