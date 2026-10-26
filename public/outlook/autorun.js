/**
 * Inbox Retina (mckellar.dev) — Outlook Office Add-in (classic + New Outlook)
 * Mailtrack-parity send handler:
 *   - Respects compose toggle (default ON for every account)
 *   - Registers with correct sender (userProfile.emailAddress)
 *   - Wraps links + injects open pixel (best-effort)
 *   - Never blocks Send past ~4s
 */

/* global Office */

var RETINA_HOST = 'https://mckellar.dev';
var TRACK_KEY = 'retina_outlook_track_enabled';
var TRAILING_PUNCT = /[.,!?;:)]+$/;

function isTrackingEnabled() {
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
    } catch (e) { /* ignore */ }

    try {
        var local = localStorage.getItem(TRACK_KEY);
        if (local === '0') return false;
        if (local === '1') return true;
    } catch (e2) { /* ignore */ }

    return true;
}

function wrapLinksInHtml(bodyHtml, uid) {
    if (!bodyHtml) return { wrapped: false, html: bodyHtml };
    var wrapped = false;

    var out = bodyHtml.replace(/href\s*=\s*(["'])(.*?)\1/gi, function (match, quote, url) {
        if (!url || url.indexOf('mailto:') === 0 || url.indexOf('#') === 0) return match;
        if (url.indexOf('/l.php') !== -1 || url.indexOf('/api/l') !== -1) return match;
        if (url.indexOf('http') !== 0) return match;

        var cleanUrl = url.replace(TRAILING_PUNCT, '');
        var trackingUrl =
            RETINA_HOST +
            '/api/l?uid=' +
            encodeURIComponent(uid) +
            '&url=' +
            encodeURIComponent(cleanUrl);
        wrapped = true;
        return 'href=' + quote + trackingUrl + quote;
    });

    return { wrapped: wrapped, html: out };
}

function reportDiagnostic(message, stack, context) {
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', RETINA_HOST + '/api/retina/diagnostics/', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 3000;
        xhr.send(
            JSON.stringify({
                source: 'outlook-addin-mckellar',
                message: message || 'Unknown error',
                stack: stack || '',
                context: context || {},
            })
        );
    } catch (err) {
        // never break send
    }
}

function registerSent(uid, recipient, subj, sender) {
    try {
        var registerUrl =
            RETINA_HOST +
            '/api/pixel/?register_sent=1&uid=' +
            encodeURIComponent(uid) +
            '&r=' +
            encodeURIComponent(recipient) +
            '&s=' +
            encodeURIComponent(subj) +
            '&src=outlook' +
            (sender ? '&sender=' + encodeURIComponent(sender) : '');

        var xhr = new XMLHttpRequest();
        xhr.open('GET', registerUrl, true);
        xhr.timeout = 5000;
        xhr.onerror = function () {
            reportDiagnostic('registerSent XHR failed', '', { subject: subj, sender: sender });
        };
        xhr.ontimeout = function () {
            reportDiagnostic('registerSent XHR timed out', '', { subject: subj });
        };
        xhr.send();
    } catch (err) {
        reportDiagnostic('registerSent threw', err ? err.message || String(err) : '', {
            subject: subj,
            sender: sender,
        });
    }
}

function getSenderEmail() {
    try {
        if (Office.context && Office.context.mailbox && Office.context.mailbox.userProfile) {
            return Office.context.mailbox.userProfile.emailAddress || '';
        }
    } catch (e) { /* ignore */ }
    return '';
}

function onMessageSendHandler(event) {
    reportDiagnostic('onMessageSendHandler fired', '', {
        tracking: isTrackingEnabled(),
        sender: getSenderEmail(),
    });

    var finish = function () {
        event.completed({ allowEvent: true });
    };

    if (!isTrackingEnabled()) {
        reportDiagnostic('tracking disabled by compose toggle', '', {});
        finish();
        return;
    }

    try {
        var item = Office.context.mailbox.item;
        var completed = false;
        var safeFinish = function () {
            if (completed) return;
            completed = true;
            finish();
        };

        setTimeout(safeFinish, 4000);

        var senderEmail = getSenderEmail();

        item.subject.getAsync(function (subjectResult) {
            var subject =
                subjectResult.status === Office.AsyncResultStatus.Succeeded && subjectResult.value
                    ? subjectResult.value
                    : 'No Subject';

            item.to.getAsync(function (toResult) {
                var recipientEmails = 'Unknown';
                if (
                    toResult.status === Office.AsyncResultStatus.Succeeded &&
                    toResult.value &&
                    toResult.value.length > 0
                ) {
                    recipientEmails = toResult.value
                        .map(function (r) {
                            return r.emailAddress || r.displayName || 'Unknown';
                        })
                        .join(', ');
                }

                var uid = 'm-' + Date.now();

                registerSent(uid, recipientEmails, subject, senderEmail);

                var pixelUrl =
                    RETINA_HOST +
                    '/api/pixel/?uid=' +
                    encodeURIComponent(uid) +
                    '&r=' +
                    encodeURIComponent(recipientEmails) +
                    '&s=' +
                    encodeURIComponent(subject) +
                    '&src=outlook' +
                    (senderEmail ? '&sender=' + encodeURIComponent(senderEmail) : '');

                var pixelHtml =
                    '<div style="display:none;max-height:0;overflow:hidden;" data-retina-uid="' +
                    uid +
                    '">' +
                    '<img src="' +
                    pixelUrl +
                    '" width="1" height="1" style="display:none;border:0;outline:none;" alt="" />' +
                    '</div>';

                function doPixelAndComplete() {
                    try {
                        if (item.body && typeof item.body.appendOnSendAsync === 'function') {
                            item.body.appendOnSendAsync(
                                pixelHtml,
                                { coercionType: Office.CoercionType.Html },
                                function (appendResult) {
                                    if (appendResult.status === Office.AsyncResultStatus.Failed) {
                                        reportDiagnostic(
                                            'appendOnSendAsync failed',
                                            appendResult.error ? appendResult.error.message : '',
                                            { subject: subject, sender: senderEmail }
                                        );
                                    }
                                    safeFinish();
                                }
                            );
                        } else {
                            reportDiagnostic('appendOnSendAsync not available', '', {
                                subject: subject,
                            });
                            safeFinish();
                        }
                    } catch (pixelErr) {
                        reportDiagnostic(
                            'doPixelAndComplete threw',
                            pixelErr ? pixelErr.message || String(pixelErr) : '',
                            { subject: subject }
                        );
                        safeFinish();
                    }
                }

                try {
                    item.body.getAsync(Office.CoercionType.Html, function (bodyResult) {
                        if (bodyResult.status === Office.AsyncResultStatus.Succeeded && bodyResult.value) {
                            var res = wrapLinksInHtml(bodyResult.value, uid);
                            if (res.wrapped) {
                                item.body.setAsync(
                                    res.html,
                                    { coercionType: Office.CoercionType.Html },
                                    function () {
                                        doPixelAndComplete();
                                    }
                                );
                            } else {
                                doPixelAndComplete();
                            }
                        } else {
                            doPixelAndComplete();
                        }
                    });
                } catch (bodyErr) {
                    reportDiagnostic(
                        'body.getAsync threw',
                        bodyErr ? bodyErr.message || String(bodyErr) : '',
                        { subject: subject }
                    );
                    doPixelAndComplete();
                }
            });
        });
    } catch (handlerErr) {
        reportDiagnostic(
            'onMessageSendHandler crashed',
            handlerErr ? handlerErr.message || String(handlerErr) : '',
            {}
        );
        finish();
    }
}

function associateHandler() {
    if (typeof Office === 'undefined') return;
    if (Office.actions && typeof Office.actions.associate === 'function') {
        Office.actions.associate('onMessageSendHandler', onMessageSendHandler);
    }
}

if (typeof Office !== 'undefined') {
    associateHandler();
    if (typeof Office.onReady === 'function') {
        Office.onReady(function () {
            associateHandler();
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        wrapLinksInHtml: wrapLinksInHtml,
        onMessageSendHandler: onMessageSendHandler,
        isTrackingEnabled: isTrackingEnabled,
    };
}
