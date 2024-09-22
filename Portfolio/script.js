// Add smooth scrolling for the navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// JavaScript for reveal on scroll
document.addEventListener('scroll', () => {
    document.querySelectorAll('.section').forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop < window.innerHeight * 0.75) {
            section.classList.add('visible');
        }
    });
});

document.addEventListener("scroll", function() {
    const heroText = document.querySelector(".hero-content h1");
    const aboutSection = document.getElementById("about");
    const projectSection = document.getElementById("projects");

    const scrollY = window.scrollY;

    // Trigger text appearance as you scroll
    if (scrollY > 100) {
        heroText.style.opacity = "1";
        heroText.style.transform = "translateY(0)";
    }

    // Trigger About section scroll up while keeping the text sticky
    if (scrollY > aboutSection.offsetTop - window.innerHeight) {
        aboutSection.classList.add("visible");
    }

    // Trigger Projects section scroll up
    if (scrollY > projectSection.offsetTop - window.innerHeight) {
        projectSection.classList.add("visible");
    }
});
