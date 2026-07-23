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

    const mapGroup = svg.append("g").attr("id", "map-group");
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
    const captureBtn = document.getElementById("capture-btn");
    
    let currentIndex = 0;
    let idleTimer;

    // কোর অ্যানিমেশন ফাংশন (একটি নির্দিষ্ট দেশের জন্য)
    const animateCountry = (index, callback) => {
        const currentData = finalParticipants[index];

        tooltip.classList.remove("visible");
        marker.classList.remove("visible");

        // জুম আউট
        mapGroup.transition()
            .duration(500)
            .attr("transform", "translate(0,0) scale(1)");

        setTimeout(() => {
            const feature = geoData.features.find(f => f.properties.name === currentData.d3Name);

            if (feature) {
                const centroid = pathGen.centroid(feature);
                const x = centroid[0];
                const y = centroid[1];
                const [[x0, y0], [x1, y1]] = pathGen.bounds(feature);
                
                const scale = Math.max(1, Math.min(3, 0.5 / Math.max((x1 - x0) / width, (y1 - y0) / height)));
                const translate = [width / 2 - scale * x, height / 2 - scale * y];

                // জুম ইন
                mapGroup.transition()
                    .duration(700)
                    .attr("transform", `translate(${translate[0]},${translate[1]}) scale(${scale})`);

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
                    
                    // ইনফরমেশন দেখানোর পর কলব্যাক
                    if (callback) setTimeout(callback, 2000);
                }, 700); 
            } else {
                if (callback) setTimeout(callback, 500);
            }
        }, 600); 
    };

    // সাধারণ অবস্থায় লুপ চলার ফাংশন
    const loopIdle = () => {
        if(finalParticipants.length === 0) return;
        animateCountry(currentIndex, () => {
            currentIndex = (currentIndex + 1) % finalParticipants.length;
            idleTimer = setTimeout(loopIdle, 300);
        });
    };

    // শুরুতে ম্যাপ লোড হওয়ার পর আইডল অ্যানিমেশন শুরু
    setTimeout(loopIdle, 1000);

    // --- ক্যাপচার মোড লজিক ---
    captureBtn.addEventListener("click", () => {
        // ১. সাধারণ লুপ বন্ধ করা এবং বাটন হাইড করা
        clearTimeout(idleTimer);
        captureBtn.style.display = "none";
        
        // ২. সিকোয়েন্স একদম প্রথম দেশ থেকে শুরু করা
        currentIndex = 0;

        const runSequence = () => {
            // যদি সব দেশের লিস্ট শেষ হয়ে যায়
            if (currentIndex >= finalParticipants.length) {
                captureBtn.style.display = "flex"; // বাটন আবার শো করবে
                currentIndex = 0;
                
                // ম্যাপ রিসেট করে আবার সাধারণ লুপ চালু করা
                mapGroup.transition().duration(500).attr("transform", "translate(0,0) scale(1)");
                tooltip.classList.remove("visible");
                marker.classList.remove("visible");
                
                idleTimer = setTimeout(loopIdle, 1000);
                return;
            }

            // একটি দেশের অ্যানিমেশন শেষ হলে পরেরটিতে যাবে
            animateCountry(currentIndex, () => {
                currentIndex++;
                runSequence();
            });
        };

        runSequence();
    });
});
