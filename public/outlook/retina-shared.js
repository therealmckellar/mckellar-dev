/**
 * Inbox Retina (mckellar.dev) — shared helpers for Outlook compose / read task panes.
 * Loaded by taskpane.html after Office.js.
 */
/* global Office */

var RETINA_HOST = 'https://mckellar.dev';
var TRACK_KEY = 'retina_outlook_track_enabled'; // '1' | '0'

function retinaGetTrackEnabled() {
    try {
        if (
            typeof Office !== 'undefined' &&
            Office.roamingSettings &&
            typeof Office.roamingSettings.get === 'function'
        ) {
            var v = Office.roamingSettings.get(TRACK_KEY);
            if (v === '0' || v === 0 || v === false) return false;
            if (v === '1' || v === 1 || v === true) return true;
        }
    } catch (e) { /* fall through */ }

    try {
        var local = localStorage.getItem(TRACK_KEY);
        if (local === '0') return false;
        if (local === '1') return true;
    } catch (e2) { /* ignore */ }

    return true; // default ON — Mailtrack-style
}

function retinaSetTrackEnabled(enabled) {
    var val = enabled ? '1' : '0';
    try {
        localStorage.setItem(TRACK_KEY, val);
    } catch (e) { /* ignore */ }
    try {
        if (
            typeof Office !== 'undefined' &&
            Office.roamingSettings &&
            typeof Office.roamingSettings.set === 'function'
        ) {
            Office.roamingSettings.set(TRACK_KEY, val);
            if (typeof Office.roamingSettings.saveAsync === 'function') {
                Office.roamingSettings.saveAsync(function () {});
            } else if (typeof Office.roamingSettings.save === 'function') {
                Office.roamingSettings.save();
            }
        }
    } catch (e2) { /* ignore */ }
    return enabled;
}

function retinaGetSenderEmail() {
    try {
        if (Office.context && Office.context.mailbox && Office.context.mailbox.userProfile) {
            return Office.context.mailbox.userProfile.emailAddress || '';
        }
    } catch (e) { /* ignore */ }
    return '';
}

function retinaExtractUidFromBody(html) {
    if (!html) return '';
    var m =
        html.match(/[?&]uid=([A-Za-z0-9_-]+)/) ||
        html.match(/uid=([A-Za-z0-9_-]+)/);
    return m && m[1] ? m[1] : '';
}

function retinaFetchStatus(params, password, callback) {
    var qs = [];
    if (params.uid) qs.push('uid=' + encodeURIComponent(params.uid));
    if (params.subject) qs.push('subject=' + encodeURIComponent(params.subject));
    if (params.to) qs.push('to=' + encodeURIComponent(params.to));

    var xhr = new XMLHttpRequest();
    xhr.open('GET', RETINA_HOST + '/api/retina/status/?' + qs.join('&'), true);
    xhr.timeout = 8000;
    if (password) {
        try {
            xhr.setRequestHeader('x-retina-password', password);
        } catch (e) { /* ignore */ }
    }
    xhr.onload = function () {
        try {
            callback(null, JSON.parse(xhr.responseText || '{}'));
        } catch (err) {
            callback(err, null);
        }
    };
    xhr.onerror = function () {
        callback(new Error('network'), null);
    };
    xhr.ontimeout = function () {
        callback(new Error('timeout'), null);
    };
    xhr.send();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RETINA_HOST: RETINA_HOST,
        retinaGetTrackEnabled: retinaGetTrackEnabled,
        retinaSetTrackEnabled: retinaSetTrackEnabled,
        retinaGetSenderEmail: retinaGetSenderEmail,
        retinaExtractUidFromBody: retinaExtractUidFromBody,
        retinaFetchStatus: retinaFetchStatus,
    };
}
