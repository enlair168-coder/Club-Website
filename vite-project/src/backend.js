import { supabase } from './supabase.js';

export class BackendError extends Error { }

const RAISED_ERROR_CODE = 'P0001';
const NOT_CONNECTED_MESSAGE = 'Online registration is not connected yet. Please try again later.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

async function callFunction(name, args) {
    if (!supabase) throw new BackendError(NOT_CONNECTED_MESSAGE);

    const { data, error } = await supabase.rpc(name, args);
    if (error) {
        throw new BackendError(error.code === RAISED_ERROR_CODE ? error.message : GENERIC_MESSAGE);
    }
    return data;
}

export async function submitApplication(values) {
    const reference = await callFunction('submit_application', {
        p_full_name: values.fullName,
        p_email: values.email,
        p_phone: values.phone,
        p_gender: values.gender,
        p_generation: values.generation,
        p_school_class: values.schoolClass,
        p_motivation: values.motivation,
        p_agreed: values.agreeValues,
    });
    return { id: reference };
}

export async function submitMessage(values) {
    const reference = await callFunction('submit_message', {
        p_sender_name: values.fullName,
        p_email: values.email,
        p_body: values.message,
    });
    return { id: reference };
}
