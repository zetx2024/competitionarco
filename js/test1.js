const reviewWrap = document.getElementById("reviewWrap");
const leftArrow = document.getElementById("leftArrow");
const rightArrow = document.getElementById("rightArrow");
const imgDiv = document.getElementById("imgDiv");
const personName = document.getElementById("personName");
const rate = document.getElementById("rate");
const profession = document.getElementById("profession");
const description = document.getElementById("description");
const surpriseMeBtn = document.getElementById("surpriseMeBtn");
const chicken = document.querySelector(".chicken");

let isChickenVisible;

let people = [
	{
		photo:
			"url('https://iarco.org/assets/mentor/ahnaf.jpg')",
		name: "Mubtaseem Ahnaf Aronno",
		rate: "Research Assistant (RA) at Geisel School of Medicine at Dartmouth",
		profession: "Undergrad Student at Dartmouth",
		description:
			""
	},
	{
		photo:
			"url('https://yrjournal.org/images/staff-01.jpg')",
		name: "Sanaul Haque",
		rate: "President & Research Lead at YRJ",
		profession: "Materials Science Researcher at UW-Madison",
		description:
			"Machine learning researcher at the University of Wisconsin, Madison Skunkworks. The Informatics Skunkworks is a group dedicated to engaging undergraduates in science and engineering informatics research under Associate Postdoc Professors Dane Morgan and Ben Afflerbach. Collaboration with the NSF (National Science Foundation)."
	},
	{
		photo:
			"url('https://iarco.org/assets/mentor/masnud.jpg')",
		name: "Mahadi Masnad",
		rate: "PhD, Integrated nonlinear photonics at Institut national de la recherche scientifique - INRS",
		profession: "Student at McGill University",
		description:
			""
	},
	{
		photo:
			"url('https://iarco.org/assets/mentor/dipto.jpg')",
		name: "Shubhashis Roy Dipta",
		rate: "Graduate Research Assistant at UMBC",
		profession: "PhD in CS at University of Maryland",
		description:
			"Dipto is a Computer Science PhD Researcher under Dr. Frank Ferarro at the University of Maryland, Baltimore County (UMBC). His research combines Natural Language Processing (NLP) and Computer Vision (CV). His primary research focuses on multimodal event reasoning, understanding, and generation. "
	},
	{
		photo:
			"url('https://yrjournal.org/images/azmain.png')",
		name: "Md. Azmain Yakin Srizon",
		rate: "100+ Publications",
		profession: "CSE Dept Lecturer at RUET",
		description:
			"Reviewer of IEEE Access & YRJ Board Member"
	}

	

];

imgDiv.style.backgroundImage = people[0].photo;
personName.innerText = people[0].name;
rate.innerText = people[0].rate;
profession.innerText = people[0].profession;
description.innerText = people[0].description;
let currentPerson = 0;

//Select the side where you want to slide
function slide(whichSide, personNumber) {
	let reviewWrapWidth = reviewWrap.offsetWidth + "px";
	let descriptionHeight = description.style.height = "100%";
	//(+ or -)
	let side1symbol = whichSide === "left" ? "" : "-";
	let side2symbol = whichSide === "left" ? "-" : "";

	let tl = gsap.timeline();

	if (isChickenVisible) {
		tl.to(chicken, {
			duration: 0.4,
			opacity: 0
		});
	}

	tl.to(reviewWrap, {
		duration: 0.4,
		opacity: 0,
		translateX: `${side1symbol + reviewWrapWidth}`
	});

	tl.to(reviewWrap, {
		duration: 0,
		translateX: `${side2symbol + reviewWrapWidth}`
	});

	setTimeout(() => {
		imgDiv.style.backgroundImage = people[personNumber].photo;
	}, 400);
	setTimeout(() => {
		description.style.height = descriptionHeight;
	}, 400);
	setTimeout(() => {
		personName.innerText = people[personNumber].name;
	}, 400);
	setTimeout(() => {
		rate.innerText = people[personNumber].rate;
	}, 400);
	setTimeout(() => {
		profession.innerText = people[personNumber].profession;
	}, 400);
	setTimeout(() => {
		description.innerText = people[personNumber].description;
	}, 400);

	tl.to(reviewWrap, {
		duration: 0.4,
		opacity: 1,
		translateX: 0
	});

	if (isChickenVisible) {
		tl.to(chicken, {
			duration: 0.4,
			opacity: 1
		});
	}
}

function setNextCardLeft() {
	if (currentPerson === 4) {
		currentPerson = 0;
		slide("left", currentPerson);
	} else {
		currentPerson++;
	}

	slide("left", currentPerson);
}

function setNextCardRight() {
	if (currentPerson === 0) {
		currentPerson = 4;
		slide("right", currentPerson);
	} else {
		currentPerson--;
	}

	slide("right", currentPerson);
}

leftArrow.addEventListener("click", setNextCardLeft);
rightArrow.addEventListener("click", setNextCardRight);

surpriseMeBtn.addEventListener("click", () => {
	if (chicken.style.opacity === "0") {
		chicken.style.opacity = "1";
		imgDiv.classList.add("move-head");
		surpriseMeBtn.innerText = "Remove the chicken";
		surpriseMeBtn.classList.remove("surprise-me-btn");
		surpriseMeBtn.classList.add("hide-chicken-btn");
		isChickenVisible = true;
	} else if (chicken.style.opacity === "1") {
		chicken.style.opacity = "0";
		imgDiv.classList.remove("move-head");
		surpriseMeBtn.innerText = "Surprise me";
		surpriseMeBtn.classList.add("surprise-me-btn");
		surpriseMeBtn.classList.remove("hide-chicken-btn");
		isChickenVisible = false;
	}
});

window.addEventListener("resize", () => {
	description.style.height = "100%";
});
