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
                            aggregatedData[d3Name] = { originalName, d3Name, years: new Set(), total: 0 };
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

    // ম্যাপের বেস রেজোলিউশন ফিক্সড করা হলো (1280x720) যাতে ফুলস্ক্রিন হলেও পজিশন ঠিক থাকে
    const width = 1280;
    const height = 720;
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
    const msgObj = document.getElementById("temp-msg");
    const mapContainerRect = document.getElementById("iarc-map-container");
    
    let currentIndex = 0;
    let idleTimer;
    let isRecording = false;

    const animateCountry = (index, callback) => {
        const currentData = finalParticipants[index];

        tooltip.classList.remove("visible");
        marker.classList.remove("visible");
        mapGroup.transition().duration(500).attr("transform", "translate(0,0) scale(1)");

        setTimeout(() => {
            const feature = geoData.features.find(f => f.properties.name === currentData.d3Name);

            if (feature) {
                const centroid = pathGen.centroid(feature);
                const x = centroid[0];
                const y = centroid[1];
                const [[x0, y0], [x1, y1]] = pathGen.bounds(feature);
                
                const scale = Math.max(1, Math.min(3, 0.5 / Math.max((x1 - x0) / width, (y1 - y0) / height)));
                const translate = [width / 2 - scale * x, height / 2 - scale * y];

                mapGroup.transition().duration(700).attr("transform", `translate(${translate[0]},${translate[1]}) scale(${scale})`);

                setTimeout(() => {
                    const flagObj = flagData.find(f => f.country === currentData.originalName);
                    const flagSvg = flagObj && flagObj.svg ? flagObj.svg : '';

                    tooltip.innerHTML = `
                        <div class="tooltip-header">
                            <div class="flag-icon">${flagSvg}</div>
                            <h4>${currentData.originalName}</h4>
                        </div>
                        <p>Years: <span class="highlight">${currentData.years.join(', ')}</span></p>
                        <p>Finalists: <span class="highlight">${currentData.total}</span></p>
                    `;

                    // পজিশনিং ক্যালকুলেশন
                    const svgRect = svg.node().getBoundingClientRect();
                    const scaleX = svgRect.width / width;
                    const scaleY = svgRect.height / height;
                    const visualX = (translate[0] + x * scale) * scaleX;
                    const visualY = (translate[1] + y * scale) * scaleY;

                    marker.style.left = `${visualX}px`;
                    marker.style.top = `${visualY}px`;
                    
                    tooltip.style.left = `${visualX}px`;
                    tooltip.style.top = `${visualY - 30}px`;

                    tooltip.classList.add("visible");
                    marker.classList.add("visible");
                    
                    if (callback) setTimeout(callback, 2000); 
                }, 700); 
            } else {
                if (callback) setTimeout(callback, 500);
            }
        }, 600); 
    };

    const loopIdle = () => {
        if(finalParticipants.length === 0 || isRecording) return;
        animateCountry(currentIndex, () => {
            currentIndex = (currentIndex + 1) % finalParticipants.length;
            idleTimer = setTimeout(loopIdle, 300);
        });
    };

    setTimeout(loopIdle, 1000);

    // --- ডাবল ক্লিক বা 'R' কীবোর্ড প্রেস ইভেন্ট ---
    document.addEventListener("dblclick", startRecordingProcess);
    document.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === 'r') startRecordingProcess();
    });

    async function startRecordingProcess() {
        if (isRecording) return;
        isRecording = true;
        clearTimeout(idleTimer);

        try {
            // ১. পেজটিকে অটোমেটিক ফুল-স্ক্রিন করা
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen().catch(err => console.log(err));
            }

            // ২. স্ক্রিন শেয়ার পপ-আপ (Entire Screen অপশনের জন্য এনকারেজ করা)
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: "monitor", frameRate: 30 }
            });

            // ৩. ৫ সেকেন্ডের কাউন্টডাউন মেসেজ
            msgObj.style.display = "block";
            let count = 5;
            msgObj.innerHTML = `Recording starts in: ${count}s...`;
            
            const timer = setInterval(() => {
                count--;
                if (count > 0) {
                    msgObj.innerHTML = `Recording starts in: ${count}s...`;
                } else {
                    clearInterval(timer);
                    // কাউন্টডাউন শেষ হলে লেখাটি পুরোপুরি লুকিয়ে ফেলা
                    msgObj.style.display = "none";
                    beginCapture(stream);
                }
            }, 1000);

        } catch (err) {
            console.error("Recording Cancelled:", err);
            isRecording = false;
            if (document.fullscreenElement) document.exitFullscreen();
            idleTimer = setTimeout(loopIdle, 1000);
        }
    }

    function beginCapture(stream) {
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
            
            stream.getTracks().forEach(track => track.stop()); 
            
            // রেকর্ডিং শেষে ফুল-স্ক্রিন থেকে বেরিয়ে আসা
            if (document.fullscreenElement) document.exitFullscreen();
            
            msgObj.style.display = "block";
            msgObj.innerHTML = "Download Complete!";
            setTimeout(() => { msgObj.style.display = "none"; }, 3000);

            isRecording = false;
            idleTimer = setTimeout(loopIdle, 1000);
        };

        mediaRecorder.start();

        let recIndex = 0;
        const recordSequence = () => {
            if (recIndex >= finalParticipants.length) {
                mapGroup.transition().duration(500).attr("transform", "translate(0,0) scale(1)");
                tooltip.classList.remove("visible");
                marker.classList.remove("visible");

                setTimeout(() => {
                    if (mediaRecorder.state === "recording") {
                        mediaRecorder.stop();
                    }
                }, 1000);
                return;
            }

            animateCountry(recIndex, () => {
                recIndex++;
                recordSequence();
            });
        };

        recordSequence();
    }
});
