import { BackendError, submitApplication, submitMessage } from './backend.js';
import { showToast } from './toast.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_OR_TELEGRAM_PATTERN = /^(\+?[\d\s()-]{7,20}|@[A-Za-z0-9_]{4,32})$/;
const GENERATION_CHOICES = ['2027', '2026', 'applicant'];

const lengthBetween = (value, min, max) => value.length >= min && value.length <= max;

const validators = {
    fullName: (v) => (lengthBetween(v, 2, 80) ? '' : 'Enter your full name (2 to 80 characters).'),
    email: (v) => (EMAIL_PATTERN.test(v) ? '' : 'Enter a valid email address.'),
    phone: (v) => (PHONE_OR_TELEGRAM_PATTERN.test(v) ? '' : 'Enter a phone number or a Telegram handle such as @name.'),
    gender: (v) => (lengthBetween(v, 0, 40) ? '' : 'Please choose a shorter option.'),
    generation: (v) => (GENERATION_CHOICES.includes(v) ? '' : 'Choose a generation or applicant status.'),
    schoolClass: (v) => (lengthBetween(v, 2, 120) ? '' : 'Enter your school and class (2 to 120 characters).'),
    motivation: (v) => {
        if (v.length < 20) return 'Tell us a little more (at least 20 characters).';
        return lengthBetween(v, 20, 1000) ? '' : 'Please keep this under 1000 characters.';
    },
    message: (v) => {
        if (v.length < 10) return 'Your message needs at least 10 characters.';
        return lengthBetween(v, 10, 2000) ? '' : 'Please keep your message under 2000 characters.';
    },
};

function readFields(form) {
    const values = {};
    for (const element of form.querySelectorAll('[name]')) {
        values[element.name] = element.type === 'checkbox' ? element.checked : element.value.trim();
    }
    return values;
}

function validate(form) {
    const values = readFields(form);
    const errors = {};
    for (const [name, check] of Object.entries(validators)) {
        if (!(name in values)) continue;
        const message = check(values[name]);
        if (message) errors[name] = message;
    }
    if ('agreeValues' in values && !values.agreeValues) {
        errors.agreeValues = 'You must agree to the club values to apply.';
    }
    return { values, errors };
}

function showErrors(form, errors) {
    for (const element of form.querySelectorAll('[data-error-for]')) {
        const name = element.dataset.errorFor;
        element.textContent = errors[name] ?? '';
        const input = form.elements.namedItem(name);
        if (input) input.setAttribute('aria-invalid', errors[name] ? 'true' : 'false');
    }
}

function setLoading(form, isLoading) {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = isLoading;
    button.querySelector('[data-label]').classList.toggle('hidden', isLoading);
    const loading = button.querySelector('[data-loading]');
    loading.classList.toggle('hidden', !isLoading);
    loading.classList.toggle('inline-flex', isLoading);
}

function bindForm(form, { send, onSuccess }) {
    let isSubmitting = false;

    form.addEventListener('input', (event) => {
        const name = event.target.name;
        const errorElement = form.querySelector(`[data-error-for="${name}"]`);
        if (errorElement) {
            errorElement.textContent = '';
            event.target.setAttribute('aria-invalid', 'false');
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        const { values, errors } = validate(form);
        showErrors(form, errors);
        if (Object.keys(errors).length > 0) {
            form.elements.namedItem(Object.keys(errors)[0])?.focus();
            return;
        }

        isSubmitting = true;
        setLoading(form, true);
        try {
            const response = await send(values);
            onSuccess(response, form);
        } catch (error) {
            const message = error instanceof BackendError ? error.message : 'Something went wrong. Please try again.';
            showToast(message, 'error');
        } finally {
            isSubmitting = false;
            setLoading(form, false);
        }
    });
}

export function initForms() {
    bindForm(document.getElementById('join-form'), {
        send: submitApplication,
        onSuccess: (response) => {
            document.getElementById('registration-id').textContent = response.id;
            document.getElementById('join-card').classList.add('hidden');
            document.getElementById('join-success').classList.remove('hidden');
            showToast('Application submitted successfully.');
        },
    });

    bindForm(document.getElementById('contact-form'), {
        send: submitMessage,
        onSuccess: (response, form) => {
            form.reset();
            showToast('Thank you. Your message has been sent.');
        },
    });
}
