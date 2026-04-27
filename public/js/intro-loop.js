const introRoot = document.querySelector('.intro-loop');

if (introRoot) {
    const slides = Array.from(introRoot.querySelectorAll('.intro-slide'));
    const prevButton = introRoot.querySelector('.intro-prev');
    const nextButton = introRoot.querySelector('.intro-next');
    const indicator = introRoot.querySelector('.intro-step-indicator');

    let currentStep = 0;

    const updateStep = () => {
        slides.forEach((slide, index) => {
            const isActive = index === currentStep;
            slide.classList.toggle('is-active', isActive);
            slide.setAttribute('aria-hidden', String(!isActive));
        });

        if (indicator) {
            indicator.textContent = `Step ${currentStep + 1} of ${slides.length}`;
        }
    };

    const goToStep = (newStep) => {
        if (!slides.length) {
            return;
        }

        currentStep = (newStep + slides.length) % slides.length;
        updateStep();
    };

    prevButton?.addEventListener('click', () => {
        goToStep(currentStep - 1);
    });

    nextButton?.addEventListener('click', () => {
        goToStep(currentStep + 1);
    });

    introRoot.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            goToStep(currentStep - 1);
        }

        if (event.key === 'ArrowRight') {
            goToStep(currentStep + 1);
        }
    });

    updateStep();
}
