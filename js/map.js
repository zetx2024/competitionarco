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
        console.error("Initialization Error:", error);
        return;
    }

    const finalParticipants = Object.values(aggregatedData).map(d => ({
        originalName: d.originalName,
        d3Name: d.d3Name,
        years: Array.from(d.years).sort(),
        total: d.total
    }));

    const width = 960;
    const height = 480;
    const container = d3.select("#iarc-map-container");
    
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // আপডেট: স্কেল ৯৫ করা হয়েছে এবং ওয়াই-অ্যাক্সিস (Y-axis) অ্যাডজাস্ট করা হয়েছে যেন ম্যাপের ওপরের অংশ না কাটে
    const projection = d3.geoMercator().scale(95).translate([width / 2, height / 1.4]);
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

    const tooltip = document.getElementById("map-auto-tooltip");
    const marker = document.getElementById("map-location-marker");
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

            tooltip.style.opacity = '0';
            tooltip.classList.add("visible");
            marker.classList.add("visible"); 
            
            const tooltipRect = tooltip.getBoundingClientRect();
            const pathRect = countryPath.getBoundingClientRect();
            const containerRect = mapContainerRect.getBoundingClientRect();
            
            let targetX = (pathRect.left + pathRect.width / 2) - containerRect.left;
            let targetY = (pathRect.top + pathRect.height / 2) - containerRect.top;

            marker.style.left = `${targetX}px`;
            marker.style.top = `${targetY}px`;

            let leftPos = targetX - (tooltipRect.width / 2);
            let topPos = targetY - tooltipRect.height - 30;

            if (leftPos < 10) {
                leftPos = 10;
            } else if (leftPos + tooltipRect.width > containerRect.width - 10) {
                leftPos = containerRect.width - tooltipRect.width - 10;
            }

            if (topPos < 10) {
                topPos = targetY + 15; 
            }

            tooltip.style.left = `${leftPos}px`;
            tooltip.style.top = `${topPos}px`;
            tooltip.style.opacity = '1';
            
            setTimeout(() => {
                tooltip.classList.remove("visible");
                marker.classList.remove("visible");
            }, 2000);
        }

        currentIndex = (currentIndex + 1) % finalParticipants.length;
    }, 2500); 
});
