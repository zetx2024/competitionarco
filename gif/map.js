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
    let currentIndex = 0;
    let animationInterval;

    const runAnimationCycle = () => {
        if(finalParticipants.length === 0) return;

        tooltip.classList.remove("visible");
        marker.classList.remove("visible");

        mapGroup.transition()
            .duration(500)
            .attr("transform", "translate(0,0) scale(1)");

        setTimeout(() => {
            const currentData = finalParticipants[currentIndex];
            const feature = geoData.features.find(f => f.properties.name === currentData.d3Name);

            if (feature) {
                const centroid = pathGen.centroid(feature);
                const x = centroid[0];
                const y = centroid[1];
                const [[x0, y0], [x1, y1]] = pathGen.bounds(feature);
                
                const scale = Math.max(1, Math.min(3, 0.5 / Math.max((x1 - x0) / width, (y1 - y0) / height)));
                const translate = [width / 2 - scale * x, height / 2 - scale * y];

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
                }, 700); 
            }

            currentIndex = (currentIndex + 1) % finalParticipants.length;
        }, 600); 
    };

    // স্টার্ট অ্যানিমেশন
    setTimeout(runAnimationCycle, 1000);
    animationInterval = setInterval(runAnimationCycle, 3000); 

    // --- রেকর্ডিং লজিক ---
    const recordBtn = document.getElementById("record-btn");
    
    recordBtn.addEventListener("click", async () => {
        try {
            // ইউজারের কাছে ট্যাব রেকর্ড করার পারমিশন চাওয়া
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { preferCurrentTab: true, frameRate: 30 }
            });

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks = [];

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'iarc_map_animation.webm';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                stream.getTracks().forEach(track => track.stop()); // স্ক্রিন শেয়ার বন্ধ করা
                recordBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg> Record Map`;
                recordBtn.classList.remove("recording");
                recordBtn.disabled = false;
            };

            mediaRecorder.start();

            // বাটন আপডেট করা
            recordBtn.innerHTML = `Recording...`;
            recordBtn.classList.add("recording");
            recordBtn.disabled = true;

            // অ্যানিমেশন একদম শুরু থেকে রিস্টার্ট করা
            clearInterval(animationInterval);
            currentIndex = 0;
            runAnimationCycle();
            animationInterval = setInterval(runAnimationCycle, 3000);

            // অটো-স্টপ ক্যালকুলেশন (কতগুলো দেশ আছে তার উপর ভিত্তি করে)
            const totalAnimationTime = finalParticipants.length * 3000;
            
            setTimeout(() => {
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                }
            }, totalAnimationTime + 500); // বাফার টাইম যোগ করা হয়েছে

        } catch (err) {
            console.error("Recording failed or cancelled by user:", err);
            recordBtn.innerHTML = `Record Failed - Try Again`;
            setTimeout(() => {
                recordBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg> Record Map`;
            }, 3000);
        }
    });
});
