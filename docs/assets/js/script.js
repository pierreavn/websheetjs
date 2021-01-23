// Initialize Animate-On-Scroll
if (typeof AOS !== "undefined") {
    AOS.init();
}

// In-page scrolling for documentaiton page
const docBtns = [...document.querySelectorAll('.doc-btn[data-section]')];
const docSections = [...document.querySelectorAll('.doc-section[data-id]')];

function setActiveDocBtn(section) {
    for (const btn of docBtns) {
        if (btn.dataset.section === section) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    }
}

function smoothScrollToDocSection(section, event) {
    const element = docSections.find(el => el.dataset.id === section);
    if (!element) return;

    setActiveDocBtn(section);
    
    // Scroll
    window.scrollTo({
        'behavior': 'smooth',
        'top': element.offsetTop - 20,
        'left': 0
    });
}

// Bind actions on doc buttons
if (docBtns.length && docSections.length > 0) {
    for (const btn of docBtns) {
        btn.addEventListener('click', smoothScrollToDocSection.bind(this, btn.dataset.section));
    }
}

// Fix doc nav to page-top once user starts scrolling
window.addEventListener('scroll', function (e) {
    const docNav = document.querySelector('.doc__nav > ul');

    // let currentSectionId = 0;
    // for (var i = 0; i < docSections.length; i++) {
    //     if (window.pageYOffset + 30 >= docSections[i].offsetTop) {
    //         currentSectionId = i;
    //     }
    // }

    // setActiveDocBtn(currentSectionId);

    if (docNav) {
        if (window.pageYOffset > 50) {
            docNav.classList.add('fixed');
        } else {
            docNav.classList.remove('fixed');
        }
    }
});
