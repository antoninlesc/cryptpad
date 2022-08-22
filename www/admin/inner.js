define([
    'jquery',
    '/api/config',
    '/customize/application_config.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-signing-keys.js',
    '/support/ui.js',

    '/lib/datepicker/flatpickr.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',

    'css!/lib/datepicker/flatpickr.min.css',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/admin/app-admin.less',
], function (
    $,
    ApiConfig,
    AppConfig,
    Crypto,
    Toolbar,
    nThen,
    SFCommon,
    h,
    Messages,
    UI,
    UIElements,
    Util,
    Hash,
    Keys,
    Support,
    Flatpickr
    )
{
    var APP = {
        'instanceStatus': {}
    };

    var Nacl = window.nacl;
    var common;
    var sFrameChan;

    var categories = {
        'general': [ // Msg.admin_cat_general
            'cp-admin-flush-cache',
            'cp-admin-update-limit',
            'cp-admin-registration',
            'cp-admin-enableembeds',
            'cp-admin-email',

            'cp-admin-instance-info-notice',

            'cp-admin-name',
            'cp-admin-description',
            'cp-admin-jurisdiction',
            'cp-admin-notice',
        ],
        'quota': [ // Msg.admin_cat_quota
            'cp-admin-defaultlimit',
            'cp-admin-setlimit',

            //'cp-admin-archive', // XXX
            //'cp-admin-unarchive', // XXX

            //'cp-admin-getquota', // XXX
            'cp-admin-getlimits',
        ],
        'database': [
            //'cp-admin-metadata-controls',
            'cp-admin-account-metadata',
            'cp-admin-document-metadata',
            'cp-admin-block-metadata',
        ],
        'stats': [ // Msg.admin_cat_stats
            'cp-admin-refresh-stats',
            'cp-admin-uptime',
            'cp-admin-active-sessions',
            'cp-admin-active-pads',
            'cp-admin-open-files',
            'cp-admin-registered',
            'cp-admin-disk-usage',
        ],
        'support': [ // Msg.admin_cat_support
            'cp-admin-support-list',
            'cp-admin-support-init',
            'cp-admin-support-priv',
        ],
        'broadcast': [ // Msg.admin_cat_broadcast
            'cp-admin-maintenance',
            'cp-admin-survey',
            'cp-admin-broadcast',
        ],
        'performance': [ // Msg.admin_cat_performance
            'cp-admin-refresh-performance',
            'cp-admin-performance-profiling',
            'cp-admin-enable-disk-measurements',
            'cp-admin-bytes-written',
        ],
        'network': [ // Msg.admin_cat_network
            'cp-admin-update-available',
            'cp-admin-checkup',
            'cp-admin-block-daily-check',
            //'cp-admin-provide-aggregate-statistics',
            'cp-admin-list-my-instance',

            'cp-admin-consent-to-contact',
            'cp-admin-remove-donate-button',
            'cp-admin-instance-purpose',
        ],
    };

    var create = {};

    var keyToCamlCase = function (key) {
        return key.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    };

    var makeBlock = function (key, addButton) { // Title, Hint, maybeButton
        // Convert to camlCase for translation keys
        var safeKey = keyToCamlCase(key);
        var $div = $('<div>', {'class': 'cp-admin-' + key + ' cp-sidebarlayout-element'});
        $('<label>').text(Messages['admin_'+safeKey+'Title'] || key).appendTo($div);
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages['admin_'+safeKey+'Hint'] || 'Coming soon...').appendTo($div);
        if (addButton) {
            $('<button>', {
                'class': 'btn btn-primary'
            }).text(Messages['admin_'+safeKey+'Button'] || safeKey).appendTo($div);
        }
        return $div;
    };
    create['update-limit'] = function () {
        var key = 'update-limit';
        var $div = makeBlock(key, true); // Msg.admin_updateLimitHint, .admin_updateLimitTitle, .admin_updateLimitButton
        $div.find('button').click(function () {
            sFrameChan.query('Q_UPDATE_LIMIT', null, function (e, res) {
                if (e || (res && res.error)) { return void console.error(e || res.error); }
                UI.alert(Messages.admin_updateLimitDone || 'done');
            });
        });
        return $div;
    };
    create['flush-cache'] = function () {
        var key = 'flush-cache';
        var $div = makeBlock(key, true); // Msg.admin_flushCacheHint, .admin_flushCacheTitle, .admin_flushCacheButton
        var called = false;
        $div.find('button').click(function () {
            if (called) { return; }
            called = true;
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'FLUSH_CACHE',
            }, function (e, data) {
                called = false;
                UI.alert(data ? Messages.admin_flushCacheDone || 'done' : 'error' + e);
            });
        });
        return $div;
    };

    var isHex = s => !/[^0-9a-f]/.test(s);

/*
    var archiveForm = function (archive, $div, $button) {
        var label = h('label', { for: 'cp-admin-archive' }, Messages.admin_archiveInput);
        var input = h('input#cp-admin-archive', {
            type: 'text'
        });

        var label2 = h('label.cp-admin-pw', {
            for: 'cp-admin-archive-pw'
        }, Messages.admin_archiveInput2);
        var input2 = UI.passwordInput({
            id: 'cp-admin-archive-pw',
            placeholder: Messages.login_password
        });
        var input3 = h('input', {
            id: 'cp-admin-archive-reason',
        });
        var label3 = h('label', {
            for: 'cp-admin-archive-reason',
        }, Messages.admin_archiveNote);

        var $pw = $(input2);
        $pw.addClass('cp-admin-pw');
        var $pwInput = $pw.find('input');


        $button.before(h('div.cp-admin-setlimit-form', [
            label,
            input,
            label2,
            input2,
            label3,
            input3,
        ]));

        $div.addClass('cp-admin-nopassword');

        var parsed;
        var $input = $(input).on('keypress change paste', function () {
            setTimeout(function () {
                $input.removeClass('cp-admin-inval');
                var val = $input.val().trim();
                if (!val) {
                    $div.toggleClass('cp-admin-nopassword', true);
                    return;
                }

                // accept raw channel and file IDs
                if (isHex(val) && [32, 48].includes(val.length)) {
                    parsed = Hash.isValidHref(`/pad/#/3/pad/edit/${val}/`);
                } else {
                    parsed = Hash.isValidHref(val);
                    $pwInput.val('');
                }

                if (!parsed || !parsed.hashData) {
                    $div.toggleClass('cp-admin-nopassword', true);
                    return void $input.addClass('cp-admin-inval');
                }

                var pw = parsed.hashData.version !== 3 && parsed.hashData.password;
                $div.toggleClass('cp-admin-nopassword', !pw);
            });
        });
        $pw.on('keypress change', function () {
            setTimeout(function () {
                $pw.toggleClass('cp-admin-inval', !$pwInput.val());
            });
        });

        var clicked = false;
        $button.click(function () {
            if (!parsed || !parsed.hashData) {
                UI.warn(Messages.admin_archiveInval);
                return;
            }
            var pw = parsed.hashData.password ? $pwInput.val() : undefined;
            var channel;
            if (parsed.hashData.version === 3) {
                channel = parsed.hashData.channel;
            } else {
                var secret = Hash.getSecrets(parsed.type, parsed.hash, pw);
                channel = secret && secret.channel;
            }

            if (!channel) {
                UI.warn(Messages.admin_archiveInval);
                return;
            }

            if (clicked) { return; }
            clicked = true;

            nThen(function (waitFor) {
                if (!archive) { return; }
                common.getFileSize(channel, waitFor(function (err, size) {
                    if (!err && size === 0) {
                        clicked = false;
                        waitFor.abort();
                        return void UI.warn(Messages.admin_archiveInval);
                    }
                }), true);
            }).nThen(function () {
                var $reason = $(input3);
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: archive ? 'ARCHIVE_DOCUMENT' : 'RESTORE_ARCHIVED_DOCUMENT',
                    data: {
                        id: channel,
                        reason: $reason.val(),
                    },
                }, function (err, obj) {
                    var e = err || (obj && obj.error);
                    clicked = false;
                    if (e) {
                        UI.warn(Messages.error);
                        console.error(e);
                        return;
                    }
                    UI.log(archive ? Messages.archivedFromServer : Messages.restoredFromServer);
                    $input.val('');
                    $pwInput.val('');
                    // disabled because it's actually pretty annoying to re-enter this each time if you are archiving many files
                    //$reason.val('');
                });
            });
        });
    };
*/

/*
    create['archive'] = function () {
        var key = 'archive';
        var $div = makeBlock(key, true); // Msg.admin_archiveHint, .admin_archiveTitle, .admin_archiveButton
        var $button = $div.find('button');
        archiveForm(true, $div, $button);
        return $div;
    };
*/
/*
    create['unarchive'] = function () {
        var key = 'unarchive';
        var $div = makeBlock(key, true); // Msg.admin_unarchiveHint, .admin_unarchiveTitle, .admin_unarchiveButton
        var $button = $div.find('button');
        archiveForm(false, $div, $button);
        return $div;
    };
*/

    Messages.admin_metadataControlsHint = 'admin_metadataControlsHint'; // XXX
    Messages.admin_metadataControlsTitle = 'admin_metadataControlsTitle'; // XXX
    Messages.admin_metadataControlsButton = 'admin_metadataControlsTitle'; // XXX

    create['metadata-controls'] = function () { // XXX
        var key = 'metadata-controls';
        var $div = makeBlock(key, true);

        return $div;
    };

    Messages.admin_accountMetadataTitle = 'Account information'; // XXX
    Messages.admin_accountMetadataHint = `Enter a user's public key to fetch data about their account.`; // XXX
    Messages.admin_accountMetadataButton = 'Generate report'; // XXX

    var sframeCommand = function (command, data, cb) {
        sFrameChan.query('Q_ADMIN_RPC', {
            cmd: command,
            data: data,
        }, function (err, response) {
            if (err) { return void cb(err); }
            if (response && response.error) { return void cb(response.error); }
            try {
                cb(void 0, response);
            } catch (err2) {
                console.error(err2);
            }
        });
    };

    var makeMetadataTable = function (cls) {
        var table = h(`table.${cls || 'cp-account-stats'}`);
        var row = (label, value) => {
            table.appendChild(h('tr', [
                h('td', h('strong', label)),
                h('td', value)
            ]));
        };

        return {
            row: row,
            table: table,
        };
    };

    var getAccountData = function (key, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var data = {
            generated: +new Date(),
            key: key,
        };

        return void nThen(function (w) {
            sframeCommand('GET_PIN_ACTIVITY', key, w((err, response) => {
                if (err) {
                    console.error(err);
                    UI.warn(Messages.error);
                } else if (!response || !response[0]) {
                    console.error(response); // XXX
                    UI.warn('NO RESPONSE'); // XXX
                } else {
                    data.first = response[0].first;
                    data.latest = response[0].latest;
                    console.info(err, response);
                }
            }));
        }).nThen(function (w) {
            sframeCommand('IS_USER_ONLINE', key, w((err, response) => {
                console.log('online', err, response);
                if (!Array.isArray(response) || typeof(response[0]) !== 'boolean') { return; }
                data.currentlyOnline = response[0];
            }));
        }).nThen(function (w) {
            sframeCommand('GET_USER_QUOTA', key, w((err, response) => {
                if (err || !response) {
                    return void console.error('quota', err, response);
                } else {
                    data.plan = response[1];
                    data.note = response[2];
                    data.limit = response[0];
                }
            }));
        }).nThen(function (w) {
            // storage used
            sframeCommand('GET_USER_TOTAL_SIZE', key, w((err, response) => {
                if (err || !Array.isArray(response)) {
                    //console.error('size', err, response);
                } else {
                    //console.info('size', response);
                    data.usage = response[0];
                }
            }));
        }).nThen(function (w) {
            // channels pinned
            // files pinned
            sframeCommand('GET_USER_STORAGE_STATS', key, w((err, response) => {
                if (err || !Array.isArray(response) || !response[0]) {
                    UI.warn(Messages.error);
                    return void console.error('storage stats', err, response);
                } else {
                    data.channels = response[0].channels;
                    data.files = response[0].files;
                }
            }));
        }).nThen(function (w) { // pin log status (live, archived, unknown)
            sframeCommand('GET_PIN_LOG_STATUS', key, w((err, response) => {
                if (err || !Array.isArray(response) || !response[0]) {
                    console.error('pin log status', err, response); // XXX
                    return void UI.warn(Messages.error);
                } else {
                    console.info('pin log status', response);
                    data.live = response[0].live;
                    data.archived = response[0].archived;
                }
            }));
        }).nThen(function () {
            console.log(data);
            cb(void 0, data);
        });
    };

    var getPrettySize = UIElements.prettySize;
    Messages.admin_generatedAt = 'Time generated'; // XXX

    // pin log available
    Messages.ui_true = 'true';
    Messages.ui_false = 'false';
    Messages.ui_undefined = 'unknown';

    var localizeState = state => {
        var o = {
            'true': Messages.ui_true,
            'false': Messages.ui_false,
            'undefined': Messages.ui_undefined,
        };
        return o[state] || 'oops'; // XXX
    };

    var disable = $el => $el.attr('disabled', 'disabled');
    var enable = $el => $el.removeAttr('disabled');

    Messages.ui_none = 'none'; // XXX
    var maybeDate = function (d) {
        return d? new Date(d): Messages.ui_undefined;
    };

    var renderAccountData = function (data) {
        var tableObj = makeMetadataTable('cp-account-stats');
        var row = tableObj.row;

    // info
        row(Messages.admin_generatedAt, new Date(data.generated));

        // signing key
        row(Messages.settings_publicSigningKey, data.key);


        // First pin activity time
        Messages.admin_firstPinTime = 'First pin activity time'; // XXX
        row(Messages.admin_firstPinTime, maybeDate(data.first));

        // last pin activity time
        Messages.admin_lastPinTime = 'Last pin activity time'; // XXX
        row(Messages.admin_lastPinTime, maybeDate(data.latest));

        // currently online
        Messages.admin_currentlyOnline = 'Is currently online'; // XXX
        row(Messages.admin_currentlyOnline, data.currentlyOnline);

        // plan name
        Messages.admin_planName = 'Plan name'; // XXX
        row(Messages.admin_planName, data.plan || Messages.ui_none);

        // plan note
        Messages.admin_note = 'Plan note'; // XXX
        row(Messages.admin_note, data.note || Messages.ui_none);

        // storage limit
        Messages.admin_limit = "Storage limit"; // XXX
        row(Messages.admin_limit, getPrettySize(data.limit));

        // data stored
        Messages.admin_storageUsage =  'Data stored'; // XXX
        row(Messages.admin_storageUsage, getPrettySize(data.usage));

        // number of channels
        Messages.admin_channelCount = "Number of channels"; // XXX
        row(Messages.admin_channelCount, data.channels);

        // number of files pinned
        Messages.admin_fileCount = 'Number of files'; // XXX
        row(Messages.admin_fileCount, data.files);

        Messages.admin_pinLogAvailable = "Pin log is available"; // XXX
        row(Messages.admin_pinLogAvailable, localizeState(data.live));

        // pin log archived
        Messages.admin_pinLogArchived = 'Pin log is archived'; // XXX
        row(Messages.admin_pinLogArchived, localizeState(data.archived));

        var BTN = function (cls) {
            return function (text, handler) {
                var btn = h(`button.btn.btn-${cls}`, text);
                if (handler) { $(btn).click(handler); }
                return btn;
            };
        };

        var primary = BTN('primary');
        var danger = BTN('danger');

    // actions
        if (data.archived && data.live === false) {
            Messages.admin_restoreArchivedPins = "Restore archived pin log"; // XXX
            Messages.admin_pinLogRestored = 'Pin log restored'; // XXX
            Messages.ui_restore = 'Restore';

            row(Messages.admin_restoreArchivedPins, primary(Messages.ui_restore, function () {
                // XXX confirm first
                sframeCommand('RESTORE_ARCHIVED_PIN_LOG', data.key, function (err) {
                    if (err) {
                        console.error(err);
                        return void UI.warn(Messages.error);
                    }
                    UI.log(Messages.admin_pinLogRestored);
                });
            }));
        }

        if (data.live === true) {
            var getPins = () => {
                sframeCommand('GET_PIN_LIST', data.key, (err, pins) => {
                    if (err || !Array.isArray(pins)) {
                        return void UI.warn(Messages.error); // XXX
                    }
                    var P = pins.slice().sort((a, b) => a.length - b.length);
                    UI.alert(h('ul', P.map(p => h('li', h('code', p)))));
                });
            };

            // get full pin list
            Messages.admin_getPinList = 'Get full pin list'; // XXX
            row(Messages.admin_getPinList, primary('go', getPins)); // XXX display modal with pre or ul and buttons to copy/download

            // get full pin history
            Messages.admin_getFullPinHistory = 'Get full pin history (not implemented)'; // XXX
            var getHistoryHandler = () => {
                sframeCommand('GET_PIN_HISTORY', data.key, (err, history) => {
                    if (err) { return void UI.warn(err); }
                    UI.log(history); // XXX
                });
            };
            var pinHistoryButton =  primary('go', getHistoryHandler);
            disable($(pinHistoryButton));

            row(Messages.admin_getFullPinHistory, pinHistoryButton); // XXX display modal with pre and buttons to copy/download

            // archive pin log
            Messages.admin_archivePinLog = "Archive this account's pin log";  // XXX
            Messages.admin_pinLogArchived = "Pin log archived"; // XXX
            Messages.admin_archivePinLogConfirm = "All content in this user's drive will be un-listed, meaning it may be deleted if it is not in any other drive."; // XXX
            Messages.ui_pleaseConfirm = "Please confirm you want to proceed"; // XXX
            Messages.ui_confirm = "Confirm"; // XXX
            var archiveHandler = () => {
                var message = h('span', [
                    h('p', Messages.admin_archivePinLogConfirm),
                    h('p', Messages.ui_pleaseConfirm),
                ]);

                UI.confirm(message, yes => {
                    if (!yes) { return; }
                    sframeCommand('ARCHIVE_PIN_LOG', data.key, (err /*, response */) => {
                        console.error(err);
                        if (err) { return void UI.warn(err); }
                        UI.log(Messages.admin_pinLogArchived);
                    });
                }, {
                    ok: Messages.ui_confirm,
                });
            };

            // XXX accessibility, tooltips
            row(Messages.admin_archivePinLog, danger(Messages.admin_archiveButton, archiveHandler)); // XXX this user's documents will no longer be considered important. inactive documents may eventually be removed if nobody else is pinning them

                // if (data.archived) {
                    // danger, will overwrite
                //} else {
                    // confirm
                //}

            // archive owned documents
            Messages.admin_archiveOwnedAccountDocuments = "Archive this account's owned documents (not implemented)"; // XXX
            Messages.admin_archiveOwnedDocumentsConfirm = "All content owned exclusively by this user will be archived. This means their documents, drive, and accounts will be made inaccessible.  This action cannot be undone. Please save the full pin list before proceeding to ensure individual documents can be restored."; // XXX
            // XXX accessibility, tooltips
            var archiveDocuments = () => {
                var message = h('span', [
                    h('p', Messages.admin_archiveDocumentConfirm),
                    h('p', Messages.ui_pleaseConfirm),
                ]);
                UI.confirm(message, yes => { // XXX
                    if (!yes) { return; }
                    sframeCommand('ARCHIVE_OWNED_DOCUMENTS', data.key, (err, response) => {
                        if (err) { return void UI.warn(err); }
                        UI.log(response);
                    });
                }, {
                    ok: Messages.ui_confirm,
                });
            };

            var archiveDocumentsButton = danger(Messages.admin_archiveButton, archiveDocuments);
            disable($(archiveDocumentsButton));
            row(Messages.admin_archiveOwnedAccountDocuments, archiveDocumentsButton);
        }
        return tableObj.table;
    };

    create['account-metadata'] = function () { // XXX
        var key = 'account-metadata';
        var $div = makeBlock(key, true);

        // input field for edPublic or user string
        Messages.admin_accountMetadataPlaceholder = 'user string (from profile/settings) or public signing key'; // XXX

        var input = h('input', {
            placeholder: Messages.admin_accountMetadataPlaceholder,
            type: 'text',
            value: '',
            //value: '[ansuz@localhost:3000/BpL3pEyX2IlfsvxQELB9uz5qh+40re0gD6J6LOobBm8=]', // XXX
        });
        var $input = $(input);

        var box = h('div.cp-admin-setter', [
            input, 
        ]);

        $div.find('.cp-sidebarlayout-description').after(box);

        var results = h('span');

        $div.append(results);

        var pending = false;
        var getInputState = function () {
            var val = $input.val().trim();
            var key = Keys.canonicalize(val);
            var state = {
                value: val,
                key: key,
                valid: Boolean(key),
                pending: pending,
            };

            return state;
        };

        var $btn = $div.find('.btn');
        disable($btn);
        var setInterfaceState = function (state) {
            state = state || getInputState();
            var both = [$input, $btn];
            if (state.pending) {
                both.forEach(disable);
            } else if (state.valid) {
                both.forEach(enable);
            } else {
                enable($input);
                disable($btn);
            }
        };

        $input.on('keypress keyup change paste', function () {
            setTimeout(setInterfaceState);
        });

        $btn.click(function (/* ev */) {
            if (pending) { return; }
            var state = getInputState();
            if (!state.valid) {
                results.innerHTML = '';
                Messages.admin_invalidKey = 'INVALID KEY'; // XXX
                return void UI.warn(Messages.admin_invalidKey);
            }
            var key = state.key;
            pending = true;
            setInterfaceState();

            getAccountData(key, (err, data) => {
                pending = false;
                setInterfaceState();
                if (!data) {
                    results.innerHTML = '';
                    return UI.warn("no data"); // XXX
                }
                var table = renderAccountData(data);
                results.innerHTML = '';
                results.appendChild(table);
            });
        });

        return $div;
    };

    Messages.admin_documentMetadataHint = `Query a channel or file via its id or link`; // XXX
    Messages.admin_documentMetadataTitle = 'Document information';// XXX
    Messages.admin_documentMetadataButton = 'Generate report'; // XXX

    var getDocumentData = function (id, cb) {
        var data = {
            generated: +new Date(),
            id: id,
        };
        var types = { // XXX handle things other than channels
            32: 'channel',
            48: 'file',
            33: 'ephemeral',
            34: 'broadcast',
        };
        data.type = types[typeof(id) === 'string' && id.length] || 'unknown';

        nThen(function (w) { // XXX
            if (data.type !== 'channel') { return; }
            sframeCommand('GET_STORED_METADATA', id, w(function (err, res) {
                if (err) { return void console.error(err); }
                if (!(Array.isArray(res) && res[0])) { return void console.error("NO_METADATA"); }
                var metadata = res[0];
                data.metadata = metadata;
                console.info('metadata', metadata);

                data.created = Util.find(data, ['metadata', 'created']);
            }));
        }).nThen(function (w) {
            sframeCommand("GET_DOCUMENT_SIZE", id, w(function (err, res) {
                console.info('got document size', err, res);
                if (err) { return void console.error(err); }
                if (!(Array.isArray(res) && typeof(res[0]) === 'number')) {
                    return void console.error("NO_SIZE");
                }
                data.size = res[0];
            }));
        }).nThen(function (w) {
            if (data.type !== 'channel') { return; }
            sframeCommand('GET_LAST_CHANNEL_TIME', id, w(function (err, res) {
                if (err) { return void console.error(err); }
                if (!Array.isArray(res) || typeof(res[0]) !== 'number') { return void console.error(res); }
                data.lastModified = res[0];
            }));
        }).nThen(function (w) {
            // whether currently open
            if (data.type !== 'channel') { return; }
            sframeCommand('GET_CACHED_CHANNEL_METADATA', id, w(function (err, res) {
                console.info("cached channel metadata", err, res);
                if (err === 'ENOENT') {
                    data.currentlyOpen = false;
                    return;
                }

                if (err) { return void console.error(err); }
                if (!Array.isArray(res) || !res[0]) { return void console.error(res); }
                data.currentlyOpen = true;
            }));
        }).nThen(function (/* w */) {
            // offset time if exists

        }).nThen(function (w) {
            // status (live, archived, unknown)
            if (!['channel', 'file'].includes(data.type)) { return; }
            sframeCommand('GET_DOCUMENT_STATUS', id, w(function (err, res) {
                if (err) { return void console.error(err); }
                if (!Array.isArray(res) || !res[0]) {
                    UI.warn(Messages.error);
                    return void console.error(err, res);
                }
                data.live = res[0].live;
                data.archived = res[0].archived;
                console.error("get channel status", err, res);
            }));
        }).nThen(function () {
            cb(void 0, data);
        });
    };

    var archiveReason = "";
    var restoreReason = "";
    var renderDocumentData = function (data) {
        var tableObj = makeMetadataTable('cp-document-stats');
        var row = tableObj.row;

        row(Messages.admin_generatedAt, maybeDate(data.generated));

        row(Messages.documentID, data.id);

        Messages.admin_documentType = 'Document type'; // XXX
        row(Messages.admin_documentType, data.type);

        Messages.admin_documentSize = 'Document size'; // XXX
        row(Messages.admin_documentSize, data.size? getPrettySize(data.size): Messages.ui_undefined);

        var BTN = (cls) => {
            return function (text, handler) {
                var btn = h(`button.btn.btn-${cls}`, text);
                if (handler) { $(btn).click(handler); }
                return btn;
            };
        };
        var primary = BTN('primary');
        var danger = BTN('danger');

        if (data.type === 'channel') {
            // XXX what to do for files?
            Messages.admin_documentMetadata = "Computed metadata"; // XXX
            try {
                row(Messages.admin_documentMetadata, h('pre', JSON.stringify(data.metadata || {}, null, 2)));
            } catch (err2) {
                UI.warn(Messages.error);
                console.error(err2);
            }

            Messages.admin_documentCreationTime = 'Document creation time'; // XXX
            row(Messages.admin_documentCreationTime, maybeDate(data.created));

            Messages.admin_documentModifiedTime = "Last modified"; // XXX
            row(Messages.admin_documentModifiedTime, maybeDate(data.lastModified));

            Messages.admin_currentlyOpen = 'Currently open?'; // XXX
            row(Messages.admin_currentlyOpen, localizeState(data.currentlyOpen));

            Messages.admin_channelAvailable = 'Channel is available'; // XXX
            row(Messages.admin_channelAvailable, localizeState(data.live));

            Messages.admin_channelArchived = 'Channel is archived'; // XXX
            row(Messages.admin_channelArchived, localizeState(data.archived));

        // actions
            // get raw metadata history
            Messages.admin_getRawMetadata = 'Get full metadata history (not implemented)';
            var metadataHistoryButton = primary('go!', function () { // XXX
                UI.warn('NOT_IMPLEMENTED'); // XXX
            });
            disable($(metadataHistoryButton));

            row(Messages.admin_getRawMetadata, metadataHistoryButton);
        }

        if (data.live) {
        // archive
            Messages.admin_archiveDocument = 'Archive document'; // XXX
            Messages.admin_archiveDocumentConfirm = "Are you sure?"; // XXX
            // XXX accessibility, tooltips (admin_unarchiveHint, admin_unarchiveTitle)

            var archiveDocumentButton = danger(Messages.admin_archiveButton, function () {
                var message = h('span', [
                    h('p', 'Please specify the reason for archiving this file and confirm that you would like to proceed'), // XXX
                    h('p', Messages.ui_pleaseConfirm),
                ]);

                UI.prompt(message, archiveReason, result => {
                    if (result === null) { return; }
                    archiveReason = result;
                    sframeCommand('ARCHIVE_DOCUMENT', {
                        id: data.id,
                        reason: archiveReason,
                    }, (err /*, response */) => {
                        if (err) {
                            console.error(err);
                            return void UI.warn(Messages.error);
                        }
                        UI.log(Messages.archivedFromServer);
                        $(archiveDocumentButton).attr('disabled', 'disabled');
                    });
                }, {
                    ok: Messages.ui_confirm,
                });
            });
            row(Messages.admin_archiveDocument, archiveDocumentButton);
        }

        if (data.archived && !data.live) {
            Messages.admin_restoreDocument = "Restore document"; // XXX
            Messages.admin_restoreDocumentConfirm = "Are you sure?";
            var restoreDocumentButton = primary(Messages.admin_unarchiveButton, function () {
                var message = h('span', [
                    h('p', 'Please specify the reason for restoring this file and confirm that you would like to proceed.'), // XXX
                    h('p', Messages.ui_pleaseConfirm),
                ]);

                UI.prompt(message, restoreReason, result => {
                    if (result === null) { return; }
                    restoreReason = result;
                    sframeCommand("RESTORE_ARCHIVED_DOCUMENT", {
                        id: data.id,
                        reason: restoreReason,
                    }, (err /*, response */) => {
                        if (err) {
                            console.error(err);
                            return void UI.warn(Messages.error);
                        }
                        UI.log(Messages.restoredFromServer);
                        $(restoreDocumentButton).attr('disabled', 'disabled');
                    });
                }, {
                    ok: Messages.ui_confirm,
                });
            });
            // XXX accessibility, tooltips (admin_unarchiveHint, admin_unarchiveTitle)
            row(Messages.admin_restoreDocument, restoreDocumentButton);
        }
        // XXX file restore button?

        return tableObj.table;
    };

    create['document-metadata'] = function () { // XXX
        var key = 'document-metadata';
        var $div = makeBlock(key, true);

        Messages.admin_documentMetadataPlaceholder = "Document URL or id"; // XXX
        var input = h('input', {
            placeholder: Messages.admin_documentMetadataPlaceholder,
            type: 'text',
            value: '',
        });

        var passwordContainer = UI.passwordInput({
            id: 'cp-database-document-pw',
            placeholder: Messages.login_password,
        });
        var $passwordContainer = $(passwordContainer);

        var $input = $(input);
        var $password = $(passwordContainer).find('input');

        var pending = false;
        var getInputState = function () {
            var val = $input.val().trim();
            var state = {
                valid: false,
                passwordRequired: false,
                id: undefined,
                input: val,
                password: $password.val().trim(),
                pending: false,
            };

            if (!val) { return state; }
            if (isHex(val) && [32, 48].includes(val.length)) {
                state.valid = true;
                state.id = val;
                return state;
            }

            var url;
            try {
                url = new URL(val, ApiConfig.httpUnsafeOrigin);
            } catch (err) {}

            if (!url) { return state; } // invalid
            var parsed = Hash.isValidHref(val);
            if (!parsed || !parsed.hashData) {
                state.passwordRequired = true;
                state.valid = false;
                return state;
            }

            if (parsed.hashData.version === 3) {
                state.id = parsed.hashData.channel;
                state.valid = true;
                return state;
            }

            var secret;
            if (parsed.hashData.password) {
                state.passwordRequired = true;
                secret = Hash.getSecrets(parsed.type, parsed.hash, state.password);
            } else {
                secret = Hash.getSecrets(parsed.type, parsed.hash);
            }
            if (secret && secret.channel) {
                state.id = secret.channel;
                state.valid = true;
                return state;
            }
            return state;
        };

        $passwordContainer.hide();
        var box = h('div.cp-admin-setter', [
            input,
            passwordContainer,
        ]);
        $div.find('.cp-sidebarlayout-description').after(box);
        var results = h('span');

        $div.append(results);

        var $btn = $div.find('.btn');
        disable($btn);

        var setInterfaceState = function () {
            var state = getInputState();
            var all = [ $btn, $password, $input ];
            var text = [$password, $input];

            if (state.pending) {
                all.forEach(disable);
            } else if (state.valid) {
                all.forEach(enable);
            } else {
                text.forEach(enable);
                disable($btn);
            }
            if (state.passwordRequired) {
                $passwordContainer.show();
            } else {
                $passwordContainer.hide();
            }
        };

        $input.on('keypress keyup change paste', function () {
            setTimeout(setInterfaceState);
        });

        $btn.click(function () {
            if (pending) { return; }
            pending = true;
            var state = getInputState();
            setInterfaceState(state);
            getDocumentData(state.id, function (err, data) {
                pending = false;
                setInterfaceState();
                if (err) {
                    results.innerHTML = '';
                    return void UI.warn(err);
                }

                var table = renderDocumentData(data);
                results.innerHTML = '';
                results.appendChild(table);
            });
        });

        return $div;
    };

    Messages.admin_blockMetadataTitle = 'Login-block information';// XXX
    Messages.admin_blockMetadataHint = `Login blocks store an account's essential credentials and are encrypted using keys derived from their username and password.`; // XXX

    // XXX admin_blockMetadataHint
// access information about login blocks
/*
    status (live/archived/unknown)
    FS metadata (ctime/atime/mtime)
    actions
        archive
        restore

*/
//`;
    Messages.admin_blockMetadataButton = 'Check block status';// XXX

    var getBlockData = function (key, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var data = {
            generated: +new Date(),
            key: key,
        };

        nThen(function (w) {
            sframeCommand('GET_DOCUMENT_STATUS', key, w((err, res) => {
                if (err) { 
                    console.error(err);
                    return void UI.warn(Messages.error);
                }
                if (!Array.isArray(res) || !res[0]) {
                    UI.warn(Messages.error);
                    return void console.error(err, res);
                }
                data.live = res[0].live;
                data.archived = res[0].archived;
            }));
        }).nThen(function () {
            cb(void 0, data);
        });
    };

    var renderBlockData  = function (data) {
        var tableObj = makeMetadataTable('cp-block-stats');
        var row = tableObj.row;

        row(Messages.admin_generatedAt, maybeDate(data.generated));

        Messages.admin_blockKey = 'Block public key';
        row(Messages.admin_blockKey, data.key);

        Messages.admin_blockAvailable = 'Block is available';
        row(Messages.admin_blockAvailable, localizeState(data.live));

        Messages.admin_blockArchived = 'Block is archived';
        row(Messages.admin_blockArchived, localizeState(data.archived));

        var BTN = function (cls) {
            return function (text, handler) {
                var btn = h(`button.btn.btn-${cls}`, text);
                if (handler) { $(btn).click(handler); }
                return btn;
            };
        };

        if (data.live) {
            // XXX archive button
            var archiveButton = BTN('danger')('ARCHIVE', function () {
                // XXX confirm first
                // add a reason
                sframeCommand('ARCHIVE_BLOCK', {
                    key: data.key,
                    reason: '', // XXX
                }, (err, res) => {
                    if (err) {
                        console.error(err);
                        return void UI.warn(Messages.error);
                    }
                    disable($(archiveButton));
                    UI.log("archive block");
                    console.log('archive block', err, res);
                });
            });
            Messages.admin_archiveBlock = "ARCHIVE BLOCK";
            row(Messages.admin_archiveBlock, archiveButton);
        }
        if (data.archived && !data.live) {
            // XXX restore button
            var restoreButton = BTN('danger')('RESTORE', function () {
                // XXX confirm first
                sframeCommand('RESTORE_ARCHIVED_BLOCK', {
                    key: data.key,
                    reason: '', // XXX
                }, (err, res) => {
                    if (err) {
                        console.error(err);
                        return void UI.warn(Messages.error);
                    }
                    disable($(restoreButton));
                    console.log('restore archived block', err, res);
                    UI.log("SUCCESS"); // XXX
                });
            });
            Messages.admin_restoreBlock = "RESTORE ARCHIVED BLOCK";
            row(Messages.admin_restoreBlock, restoreButton);
        }

        return tableObj.table;
    };

    create['block-metadata'] = function () { // XXX
        var key = 'block-metadata';
        var $div = makeBlock(key, true);

        Messages.admin_blockMetadataPlaceholder = 'XXX PLACEHOLDER';

        var input = h('input', {
            placeholder: Messages.admin_blockMetadataPlaceholder,
            value: '',
        });
        var $input = $(input);

        var box = h('div.cp-admin-setter', [
            input,
        ]);

        $div.find('.cp-sidebarlayout-description').after(box);

        var results = h('span');
        $div.append(results);
        var $btn = $div.find('.btn');
        disable($btn);

        var pending = false;
        var getInputState = function () {
            var val = $input.val().trim();
            var state = {
                pending: pending,
                valid: false,
                value: val,
                key: '',
            };

            var url;
            try {
                url = new URL(val, ApiConfig.httpUnsafeOrigin);
            } catch (err) { }
            var getKey = function () {
                var parts = val.split('/');
                return parts[parts.length - 1];
            };
            var isValidBlockURL = function (url) {
                if (!url) { return; }
                return /* url.origin === ApiConfig.httpUnsafeOrigin && */ /^\/block\/.*/.test(url.pathname) && getKey().length === 44;
            };
            if (isValidBlockURL(url)) {
                state.valid = true;
                state.key = getKey();
            }
            return state;
        };
        var setInterfaceState = function () {
            var state = getInputState();
            var all = [$btn, $input];

            if (state.pending) {
                all.forEach(disable);
            } else if (state.valid) {
                all.forEach(enable);
            } else {
                enable($input);
                disable($btn);
            }
        };

        $input.on('keypress keyup change paste', function () {
            setTimeout(setInterfaceState);
        });

        $btn.click(function () {
            if (pending) { return; }
            var state = getInputState();
            pending = true;
            setInterfaceState();
            getBlockData(state.key, (err, data) => {
                pending = false;
                setInterfaceState();
                if (!data) {
                    results.innerHTML = '';
                    return UI.warn("no data"); // XXX
                }
                var table = renderBlockData(data);
                results.innerHTML = '';
                results.appendChild(table);
            });
        });

        return $div;
    };

    var makeAdminCheckbox = function (data) {
        return function () {
            var state = data.getState();
            var key = data.key;
            var $div = makeBlock(key);
            var $hint;
            if (data.hintElement) {
                $hint = $div.find('.cp-sidebarlayout-description');
                $hint.html('');
                $hint.append(data.hintElement);
            }

            var labelKey = 'admin_' + keyToCamlCase(key) + 'Label';
            var titleKey = 'admin_' + keyToCamlCase(key) + 'Title';
            var $cbox = $(UI.createCheckbox('cp-admin-' + key,
                Messages[labelKey] || Messages[titleKey],
                state, { label: { class: 'noTitle' } }));
            var spinner = UI.makeSpinner($cbox);
            var $checkbox = $cbox.find('input').on('change', function() {
                spinner.spin();
                var val = $checkbox.is(':checked') || false;
                $checkbox.attr('disabled', 'disabled');
                data.query(val, function (state) {
                    spinner.done();
                    $checkbox[0].checked = state;
                    $checkbox.removeAttr('disabled');
                });
            });
            $cbox.appendTo($div);
            return $div;
        };
    };

    var flushCacheNotice = function () {
        var notice = UIElements.setHTML(h('p'), Messages.admin_reviewCheckupNotice);
        $(notice).find('a').attr({
            href: new URL('/checkup/', ApiConfig.httpUnsafeOrigin).href,
        }).click(function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            common.openURL('/checkup/');
        });
        var content = h('span', [
            UIElements.setHTML(h('p'), Messages.admin_cacheEvictionRequired),
            notice,
        ]);
        UI.alert(content);
    };

    // Msg.admin_registrationHint, .admin_registrationTitle
    create['registration'] = makeAdminCheckbox({
        key: 'registration',
        getState: function () {
            return APP.instanceStatus.restrictRegistration;
        },
        query: function (val, setState) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['RESTRICT_REGISTRATION', [val]]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                }
                APP.updateStatus(function () {
                    setState(APP.instanceStatus.restrictRegistration);
                    flushCacheNotice();
                });
            });
        },
    });

    // Msg.admin_enableembedsHint, .admin_enableembedsTitle
    create['enableembeds'] = makeAdminCheckbox({
        key: 'enableembeds',
        getState: function () {
            return APP.instanceStatus.enableEmbedding;
        },
        query: function (val, setState) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['ENABLE_EMBEDDING', [val]]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                }
                APP.updateStatus(function () {
                    setState(APP.instanceStatus.enableEmbedding);
                    flushCacheNotice();
                });
            });
        },
    });

    create['email'] = function () {
        var key = 'email';
        var $div = makeBlock(key, true); // Msg.admin_emailHint, Msg.admin_emailTitle
        var $button = $div.find('button').text(Messages.settings_save);

        var input = h('input', {
            type: 'email',
            value: ApiConfig.adminEmail || ''
        });
        var $input = $(input);
        var innerDiv = h('div.cp-admin-setter.cp-admin-setlimit-form', input);
        var spinner = UI.makeSpinner($(innerDiv));

        $button.click(function () {
            if (!$input.val()) { return; }
            spinner.spin();
            $button.attr('disabled', 'disabled');
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['SET_ADMIN_EMAIL', [$input.val()]]
            }, function (e, response) {
                $button.removeAttr('disabled');
                if (e || response.error) {
                    UI.warn(Messages.error);
                    $input.val('');
                    console.error(e, response);
                    spinner.hide();
                    return;
                }
                spinner.done();
                UI.log(Messages.saved);
            });
        });

        $button.before(innerDiv);

        return $div;
    };

    var getInstanceString = function (attr) {
        var val = APP.instanceStatus[attr];
        var type = typeof(val);
        switch (type) {
            case 'string': return val || '';
            case 'object': return val.default || '';
            default: return '';
        }
    };

    create['jurisdiction'] = function () { // TODO make translateable
        var key = 'jurisdiction';
        var $div = makeBlock(key, true); // Msg.admin_jurisdictionHint, Msg.admin_jurisdictionTitle, Msg.admin_jurisdictionButton
        var $button = $div.find('button').addClass('cp-listing-action').text(Messages.settings_save);

        var input = h('input', {
            type: 'text',
            value: getInstanceString('instanceJurisdiction'),
            placeholder: Messages.owner_unknownUser || '',
        });
        var $input = $(input);
        var innerDiv = h('div.cp-admin-setter', input);
        var spinner = UI.makeSpinner($(innerDiv));

        $button.click(function () {
            spinner.spin();
            $button.attr('disabled', 'disabled');
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['SET_INSTANCE_JURISDICTION', [$input.val().trim()]]
            }, function (e, response) {
                $button.removeAttr('disabled');
                if (e || response.error) {
                    UI.warn(Messages.error);
                    $input.val('');
                    console.error(e, response);
                    spinner.hide();
                    return;
                }
                spinner.done();
                UI.log(Messages._getKey('ui_saved', [Messages.admin_jurisdictionTitle]));
            });
        });

        $button.before(innerDiv);

        return $div;
    };


    create['notice'] = function () { // TODO make translateable
        var key = 'notice';
        var $div = makeBlock(key, true); // Messages.admin_noticeHint

        var $button = $div.find('button').addClass('cp-listing-action').text(Messages.settings_save);

        var input = h('input', {
            type: 'text',
            value: getInstanceString('instanceNotice'),
            placeholder: '',
        });
        var $input = $(input);
        var innerDiv = h('div.cp-admin-setter', input);
        var spinner = UI.makeSpinner($(innerDiv));

        $button.click(function () {
            spinner.spin();
            $button.attr('disabled', 'disabled');
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['SET_INSTANCE_NOTICE', [$input.val().trim()]]
            }, function (e, response) {
                $button.removeAttr('disabled');
                spinner.hide();
                if (e || response.error) {
                    UI.warn(Messages.error);
                    $input.val('');
                    console.error(e, response);
                    return;
                }
                UI.log(Messages._getKey('ui_saved', [Messages.admin_noticeTitle]));
            });
        });

        $button.before(innerDiv);

        return $div;
    };

    create['instance-info-notice'] = function () {
        return $(h('div.cp-admin-instance-info-notice.cp-sidebarlayout-element',
            h('div.alert.alert-info.cp-admin-bigger-alert', [
                Messages.admin_infoNotice1,
                ' ',
                Messages.admin_infoNotice2,
            ])
        ));
    };

    create['name'] = function () { // TODO make translateable
        var key = 'name';
        var $div = makeBlock(key, true);
        // Msg.admin_nameHint, Msg.admin_nameTitle, Msg.admin_nameButton
        var $button = $div.find('button').addClass('cp-listing-action').text(Messages.settings_save);

        var input = h('input', {
            type: 'text',
            value: getInstanceString('instanceName') || ApiConfig.httpUnsafeOrigin || '',
            placeholder: ApiConfig.httpUnsafeOrigin,
        });
        var $input = $(input);
        var innerDiv = h('div.cp-admin-setter', input);
        var spinner = UI.makeSpinner($(innerDiv));

        $button.click(function () {
            spinner.spin();
            $button.attr('disabled', 'disabled');
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['SET_INSTANCE_NAME', [$input.val().trim()]]
            }, function (e, response) {
                $button.removeAttr('disabled');
                if (e || response.error) {
                    UI.warn(Messages.error);
                    $input.val('');
                    console.error(e, response);
                    spinner.hide();
                    return;
                }
                spinner.done();
                UI.log(Messages._getKey('ui_saved', [Messages.admin_nameTitle]));
            });
        });

        $button.before(innerDiv);

        return $div;
    };

    create['description'] = function () { // TODO support translation
        var key = 'description';
        var $div = makeBlock(key, true); // Msg.admin_descriptionHint

        var textarea = h('textarea.cp-admin-description-text', {
            placeholder: Messages.home_host || '',
        }, getInstanceString('instanceDescription'));

        var $button = $div.find('button').text(Messages.settings_save);

        $button.addClass('cp-listing-action');

        var innerDiv = h('div.cp-admin-setter', [
            textarea,
        ]);
        $button.before(innerDiv);

        var $input = $(textarea);
        var spinner = UI.makeSpinner($(innerDiv));

        $button.click(function () {
            spinner.spin();
            $button.attr('disabled', 'disabled');
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['SET_INSTANCE_DESCRIPTION', [$input.val().trim()]]
            }, function (e, response) {
                $button.removeAttr('disabled');
                if (e || response.error) {
                    UI.warn(Messages.error);
                    $input.val('');
                    console.error(e, response);
                    spinner.hide();
                    return;
                }
                spinner.done();
                UI.log(Messages._getKey('ui_saved', [Messages.admin_descriptionTitle]));
            });
        });

        return $div;
    };

    create['defaultlimit'] = function () {
        var key = 'defaultlimit';
        var $div = makeBlock(key); // Msg.admin_defaultlimitHint, .admin_defaultlimitTitle
        var _limit = APP.instanceStatus.defaultStorageLimit;
        var _limitMB = Util.bytesToMegabytes(_limit);
        var limit = getPrettySize(_limit);
        var newLimit = h('input', {type: 'number', min: 0, value: _limitMB});
        var set = h('button.btn.btn-primary', Messages.admin_setlimitButton);
        $div.append(h('div', [
            h('span.cp-admin-defaultlimit-value', Messages._getKey('admin_limit', [limit])),
            h('div.cp-admin-setlimit-form', [
                h('label', Messages.admin_defaultLimitMB),
                newLimit,
                h('nav', [set])
            ])
        ]));

        UI.confirmButton(set, {
            classes: 'btn-primary',
            multiple: true,
            validate: function () {
                var l = parseInt($(newLimit).val());
                if (isNaN(l)) { return false; }
                return true;
            }
        }, function () {
            var lMB = parseInt($(newLimit).val()); // Megabytes
            var l = lMB * 1024 * 1024; // Bytes
            var data = [l];
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['UPDATE_DEFAULT_STORAGE', data]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    return void console.error(e, response);
                }
                var limit = getPrettySize(l);
                $div.find('.cp-admin-defaultlimit-value').text(Messages._getKey('admin_limit', [limit]));
            });
        });
        return $div;
    };
    create['getlimits'] = function () {
        var key = 'getlimits';
        var $div = makeBlock(key); // Msg.admin_getlimitsHint, .admin_getlimitsTitle
        APP.refreshLimits = function () {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'GET_LIMITS',
            }, function (e, data) {
                if (e) { return; }
                if (!Array.isArray(data) || !data[0]) { return; }

                $div.find('.cp-admin-all-limits').remove();

                var obj = data[0];
                if (obj && (obj.message || obj.location)) {
                    delete obj.message;
                    delete obj.location;
                }
                var list = Object.keys(obj).sort(function (a, b) {
                    return obj[a].limit > obj[b].limit;
                });

                var compact = list.length > 10;

                var content = list.map(function (key) {
                    var user = obj[key];
                    var limit = getPrettySize(user.limit);
                    var title = Messages._getKey('admin_limit', [limit]) + ', ' +
                                Messages._getKey('admin_limitPlan', [user.plan]) + ', ' +
                                Messages._getKey('admin_limitNote', [user.note]);

                    var keyEl = h('code.cp-limit-key', key);
                    $(keyEl).click(function () {
                        $('.cp-admin-setlimit-form').find('.cp-setlimit-key').val(key);
                        $('.cp-admin-setlimit-form').find('.cp-setlimit-quota').val(Math.floor(user.limit / 1024 / 1024));
                        $('.cp-admin-setlimit-form').find('.cp-setlimit-note').val(user.note);
                    });
                    if (compact) {
                        return h('tr.cp-admin-limit', {
                            title: title
                        }, [
                            h('td', keyEl),
                            h('td.limit', Messages._getKey('admin_limit', [limit])),
                            h('td.plan', Messages._getKey('admin_limitPlan', [user.plan])),
                            h('td.note', Messages._getKey('admin_limitNote', [user.note]))
                        ]);
                    }
                    return h('li.cp-admin-limit', [
                        keyEl,
                        h('ul.cp-limit-data', [
                            h('li.limit', Messages._getKey('admin_limit', [limit])),
                            h('li.plan', Messages._getKey('admin_limitPlan', [user.plan])),
                            h('li.note', Messages._getKey('admin_limitNote', [user.note]))
                        ])
                    ]);
                });
                if (compact) { return $div.append(h('table.cp-admin-all-limits', content)); }
                $div.append(h('ul.cp-admin-all-limits', content));
            });
        };
        APP.refreshLimits();
        return $div;
    };

    create['setlimit'] = function () {
        var key = 'setlimit';
        var $div = makeBlock(key); // Msg.admin_setlimitHint, .admin_setlimitTitle

        var user = h('input.cp-setlimit-key');
        var $key = $(user);
        var limit = h('input.cp-setlimit-quota', {type: 'number', min: 0, value: 0});
        var note = h('input.cp-setlimit-note');
        var remove = h('button.btn.btn-danger', Messages.fc_remove);
        var set = h('button.btn.btn-primary', Messages.admin_setlimitButton);
        var form = h('div.cp-admin-setlimit-form', [
            h('label', Messages.admin_limitUser),
            user,
            h('label', Messages.admin_limitMB),
            limit,
            h('label', Messages.admin_limitSetNote),
            note,
            h('nav', [set, remove])
        ]);
        var $note = $(note);

        var getValues = function () {
            var key = $key.val();
            var _limit = parseInt($(limit).val());
            if (key.length !== 44) {
                try {
                    var u = Keys.parseUser(key);
                    if (!u.domain || !u.user || !u.pubkey) {
                        return void UI.warn(Messages.admin_invalKey);
                    }
                } catch (e) {
                    return void UI.warn(Messages.admin_invalKey);
                }
            }
            if (isNaN(_limit) || _limit < 0) {
                return void UI.warn(Messages.admin_invalLimit);
            }
            var _note = ($note.val() || "").trim();
            return {
                key: key,
                data: {
                    limit: _limit * 1024 * 1024,
                    note: _note,
                    plan: 'custom'
                }
            };
        };

        UI.confirmButton(remove, {
            classes: 'btn-danger',
            multiple: true,
            validate: function () {
                var obj = getValues();
                if (!obj || !obj.key) { return false; }
                return true;
            }
        }, function () {
            var obj = getValues();
            var data = [obj.key];
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['RM_QUOTA', data]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
                APP.refreshLimits();
                $key.val('');
            });
        });

        $(set).click(function () {
            var obj = getValues();
            if (!obj || !obj.key) { return; }
            var data = [obj.key, obj.data];
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['SET_QUOTA', data]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
                APP.refreshLimits();
                $key.val('');
                $note.val('');
            });
        });

        $div.append(form);
        return $div;
    };

/*
    create['getquota'] = function () { // XXX remove?
        var key = 'getquota';
        var $div = makeBlock(key, true); // Msg.admin_getquotaHint, .admin_getquotaTitle, .admin_getquotaButton

        var input = h('input#cp-admin-getquota', {
            type: 'text'
        });
        var $input = $(input);

        var $button = $div.find('button');
        $button.before(h('div.cp-admin-setlimit-form', [
            input,
        ]));

        $button.click(function () {
            var val = $input.val();
            if (!val || !val.trim()) { return; }
            var key = Keys.canonicalize(val);
            if (!key) { return; }
            $input.val('');
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'GET_USER_TOTAL_SIZE',
                data: key
            }, function (e, obj) {
                if (e || (obj && obj.error)) {
                    console.error(e || obj.error);
                    return void UI.warn(Messages.error);
                }
                var size = Array.isArray(obj) && obj[0];
                if (typeof(size) !== "number") { return; }
                UI.alert(getPrettySize(size));
            });
        });

        return $div;
    };
*/

    var onRefreshStats = Util.mkEvent();

    create['refresh-stats'] = function () {
        var key = 'refresh-stats';
        var $div = $('<div>', {'class': 'cp-admin-' + key + ' cp-sidebarlayout-element'});
        var $btn = $(h('button.btn.btn-primary', Messages.oo_refresh));
        $btn.click(function () {
            onRefreshStats.fire();
        });
        $div.append($btn);
        return $div;
    };

    Messages.admin_uptimeTitle = 'Launch time';
    Messages.admin_uptimeHint = 'Date and time at which the server was launched';

    create['uptime'] = function () {
        var key = 'uptime';
        var $div = makeBlock(key); // Msg.admin_activeSessionsHint, .admin_activeSessionsTitle
        var pre = h('pre');

        var set = function () {
            var uptime = APP.instanceStatus.launchTime;
            if (typeof(uptime) !== 'number') { return; }
            pre.innerText = new Date(uptime);
        };

        set();

        $div.append(pre);
        onRefreshStats.reg(function () {
            set();
        });
        return $div;
    };

    create['active-sessions'] = function () {
        var key = 'active-sessions';
        var $div = makeBlock(key); // Msg.admin_activeSessionsHint, .admin_activeSessionsTitle
        var onRefresh = function () {
            $div.find('pre').remove();
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ACTIVE_SESSIONS',
            }, function (e, data) {
                var total = data[0];
                var ips = data[1];
                $div.find('pre').remove();
                $div.append(h('pre', total + ' (' + ips + ')'));
            });
        };
        onRefresh();
        onRefreshStats.reg(onRefresh);
        return $div;
    };
    create['active-pads'] = function () {
        var key = 'active-pads';
        var $div = makeBlock(key); // Msg.admin_activePadsHint, .admin_activePadsTitle
        var onRefresh = function () {
            $div.find('pre').remove();
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ACTIVE_PADS',
            }, function (e, data) {
                //console.log(e, data);
                $div.find('pre').remove();
                $div.append(h('pre', String(data)));
            });
        };
        onRefresh();
        onRefreshStats.reg(onRefresh);
        return $div;
    };
    create['open-files'] = function () {
        var key = 'open-files';
        var $div = makeBlock(key); // Msg.admin_openFilesHint, .admin_openFilesTitle
        var onRefresh = function () {
            $div.find('pre').remove();
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'GET_FILE_DESCRIPTOR_COUNT',
            }, function (e, data) {
                if (e || (data && data.error)) {
                    console.error(e, data);
                    $div.append(h('pre', {
                        style: 'text-decoration: underline',
                    }, String(e || data.error)));
                    return;
                }
                //console.log(e, data);
                $div.find('pre').remove();
                $div.append(h('pre', String(data)));
            });
        };
        onRefresh();
        onRefreshStats.reg(onRefresh);
        return $div;
    };
    create['registered'] = function () {
        var key = 'registered';
        var $div = makeBlock(key); // Msg.admin_registeredHint, .admin_registeredTitle
        var onRefresh = function () {
            $div.find('pre').remove();
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'REGISTERED_USERS',
            }, function (e, data) {
                //console.log(e, data);
                $div.find('pre').remove();
                $div.append(h('pre', String(data)));
            });
        };
        onRefresh();
        onRefreshStats.reg(onRefresh);
        return $div;
    };
    create['disk-usage'] = function () {
        var key = 'disk-usage';
        var $div = makeBlock(key, true); // Msg.admin_diskUsageHint, .admin_diskUsageTitle, .admin_diskUsageButton
        var called = false;
        $div.find('button').click(function () {
            $div.find('button').hide();
            if (called) { return; }
            called = true;
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'DISK_USAGE',
            }, function (e, data) {
                console.log(e, data);
                if (e) { return void console.error(e); }
                var obj = data[0];
                Object.keys(obj).forEach(function (key) {
                    var val = obj[key];
                    var unit = Util.magnitudeOfBytes(val);
                    if (unit === 'GB') {
                        obj[key] = Util.bytesToGigabytes(val) + ' GB';
                    } else if (unit === 'MB') {
                        obj[key] = Util.bytesToMegabytes(val) + ' MB';
                    } else {
                        obj[key] = Util.bytesToKilobytes(val) + ' KB';
                    }
                });
                $div.append(h('ul', Object.keys(obj).map(function (k) {
                    return h('li', [
                        h('strong', k === 'total' ? k : '/' + k),
                        ' : ',
                        obj[k]
                    ]);
                })));
            });
        });
        return $div;
    };

    var supportKey = ApiConfig.supportMailbox;
    var checkAdminKey = function (priv) {
        if (!supportKey) { return; }
        return Hash.checkBoxKeyPair(priv, supportKey);
    };

    create['support-list'] = function () {
        if (!supportKey || !APP.privateKey || !checkAdminKey(APP.privateKey)) { return; }
        var $container = makeBlock('support-list'); // Msg.admin_supportListHint, .admin_supportListTitle
        var $div = $(h('div.cp-support-container')).appendTo($container);

        var catContainer = h('div.cp-dropdown-container');
        var col1 = h('div.cp-support-column', h('h1', [
            h('span', Messages.admin_support_premium),
            h('span.cp-support-count'),
            h('button.btn.cp-support-column-button', Messages.admin_support_collapse)
        ]));
        var col2 = h('div.cp-support-column', h('h1', [
            h('span', Messages.admin_support_normal),
            h('span.cp-support-count'),
            h('button.btn.cp-support-column-button', Messages.admin_support_collapse)
        ]));
        var col3 = h('div.cp-support-column', h('h1', [
            h('span', Messages.admin_support_answered),
            h('span.cp-support-count'),
            h('button.btn.cp-support-column-button', Messages.admin_support_collapse)
        ]));
        var col4 = h('div.cp-support-column', h('h1', [
            h('span', Messages.admin_support_closed),
            h('span.cp-support-count'),
            h('button.btn.cp-support-column-button', Messages.admin_support_collapse)
        ]));
        var $col1 = $(col1), $col2 = $(col2), $col3 = $(col3), $col4 = $(col4);
        $div.append([
            //catContainer
            col1,
            col2,
            col3,
            col4
        ]);
        $div.find('.cp-support-column-button').click(function () {
            var $col = $(this).closest('.cp-support-column');
            $col.toggleClass('cp-support-column-collapsed');
            if ($col.hasClass('cp-support-column-collapsed')) {
                $(this).text(Messages.admin_support_open);
                $(this).toggleClass('btn-primary');
            } else {
                $(this).text(Messages.admin_support_collapse);
                $(this).toggleClass('btn-primary');
            }
        });
        var category = 'all';
        var $drop = APP.support.makeCategoryDropdown(catContainer, function (key) {
            category = key;
            if (key === 'all') {
                $div.find('.cp-support-list-ticket').show();
                return;
            }
            $div.find('.cp-support-list-ticket').hide();
            $div.find('.cp-support-list-ticket[data-cat="'+key+'"]').show();
        }, true);
        $drop.setValue('all');

        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var cat = privateData.category || '';
        var linkedId = cat.indexOf('-') !== -1 && cat.slice(8);

        var hashesById = {};

        var getTicketData = function (id) {
            var t = hashesById[id];
            if (!Array.isArray(t) || !t.length) { return; }
            var ed = Util.find(t[0], ['content', 'msg', 'content', 'sender', 'edPublic']);
            // If one of their ticket was sent as a premium user, mark them as premium
            var premium = t.some(function (msg) {
                var _ed = Util.find(msg, ['content', 'msg', 'content', 'sender', 'edPublic']);
                if (ed !== _ed) { return; }
                return Util.find(msg, ['content', 'msg', 'content', 'sender', 'plan']) ||
                       Util.find(msg, ['content', 'msg', 'content', 'sender', 'quota', 'plan']);
            });
            var lastMsg = t[t.length - 1];
            var lastMsgEd = Util.find(lastMsg, ['content', 'msg', 'content', 'sender', 'edPublic']);
            return {
                lastMsg: lastMsg,
                time: Util.find(lastMsg, ['content', 'msg', 'content', 'time']),
                lastMsgEd: lastMsgEd,
                lastAdmin: lastMsgEd !== ed && ApiConfig.adminKeys.indexOf(lastMsgEd) !== -1,
                premium: premium,
                authorEd: ed,
                closed: Util.find(lastMsg, ['content', 'msg', 'type']) === 'CLOSE'
            };
        };

        var addClickHandler = function ($ticket) {
            $ticket.on('click', function () {
                $ticket.toggleClass('cp-support-open', true);
                $ticket.off('click');
            });
        };
        var makeOpenButton = function ($ticket) {
            var button = h('button.btn.btn-primary.cp-support-expand', Messages.admin_support_open);
            var collapse = h('button.btn.cp-support-collapse', Messages.admin_support_collapse);
            $(button).click(function () {
                $ticket.toggleClass('cp-support-open', true);
            });
            addClickHandler($ticket);
            $(collapse).click(function (e) {
                $ticket.toggleClass('cp-support-open', false);
                e.stopPropagation();
                setTimeout(function () {
                    addClickHandler($ticket);
                });
            });
            $ticket.find('.cp-support-title-buttons').prepend([button, collapse]);
            $ticket.append(h('div.cp-support-collapsed'));
        };
        var updateTicketDetails = function ($ticket, isPremium) {
            var $first = $ticket.find('.cp-support-message-from').first();
            var user = $first.find('span').first().html();
            var time = $first.find('.cp-support-message-time').text();
            var last = $ticket.find('.cp-support-message-from').last().find('.cp-support-message-time').text();
            var $c = $ticket.find('.cp-support-collapsed');
            var txtClass = isPremium ? ".cp-support-ispremium" : "";
            $c.html('').append([
                UI.setHTML(h('span'+ txtClass), user),
                h('span', [
                    h('b', Messages.admin_support_first),
                    h('span', time)
                ]),
                h('span', [
                    h('b', Messages.admin_support_last),
                    h('span', last)
                ])
            ]);

        };

        var sort = function (id1, id2) {
            var t1 = getTicketData(id1);
            var t2 = getTicketData(id2);
            if (!t1) { return 1; }
            if (!t2) { return -1; }
            /*
            // If one is answered and not the other, put the unanswered first
            if (t1.lastAdmin && !t2.lastAdmin) { return 1; }
            if (!t1.lastAdmin && t2.lastAdmin) { return -1; }
            */
            // Otherwise, sort them by time
            return t1.time - t2.time;
        };

        var _reorder = function () {
            var orderAnswered = [];
            var orderPremium = [];
            var orderNormal = [];
            var orderClosed = [];

            Object.keys(hashesById).forEach(function (id) {
                var d = getTicketData(id);
                if (!d) { return; }
                if (d.closed) {
                    return void orderClosed.push(id);
                }
                if (d.lastAdmin /* && !d.closed */) {
                    return void orderAnswered.push(id);
                }
                if (d.premium /* && !d.lastAdmin && !d.closed */) {
                    return void orderPremium.push(id);
                }
                orderNormal.push(id);
                //if (!d.premium && !d.lastAdmin && !d.closed) { return void orderNormal.push(id); }
            });

            var cols = [$col1, $col2, $col3, $col4];
            [orderPremium, orderNormal, orderAnswered, orderClosed].forEach(function (list, j) {
                list.sort(sort);
                list.forEach(function (id, i) {
                    var $t = $div.find('[data-id="'+id+'"]');
                    var d = getTicketData(id);
                    $t.css('order', i).appendTo(cols[j]);
                    updateTicketDetails($t, d.premium);
                });
                var len;
                try {
                    len = cols[j].find('div.cp-support-list-ticket').length;
                } catch (err) {
                    UI.warn(Messages.error);
                    return void console.error(err);
                }
                if (!len) {
                    cols[j].hide();
                } else {
                    cols[j].show();
                    cols[j].find('.cp-support-count').text(len);
                }
            });
        };
        var reorder = Util.throttle(_reorder, 150);

        var to = Util.throttle(function () {
            var $ticket = $div.find('.cp-support-list-ticket[data-id="'+linkedId+'"]');
            $ticket.addClass('cp-support-open');
            $ticket[0].scrollIntoView();
            linkedId = undefined;
        }, 200);

        // Register to the "support" mailbox
        common.mailbox.subscribe(['supportadmin'], {
            onMessage: function (data) {
                /*
                    Get ID of the ticket
                    If we already have a div for this ID
                        Push the message to the end of the ticket
                    If it's a new ticket ID
                        Make a new div for this ID
                */
                var msg = data.content.msg;
                var hash = data.content.hash;
                var content = msg.content;
                var id = content.id;
                var $ticket = $div.find('.cp-support-list-ticket[data-id="'+id+'"]');

                hashesById[id] = hashesById[id] || [];
                if (hashesById[id].indexOf(hash) === -1) {
                    hashesById[id].push(data);
                }

                if (msg.type === 'CLOSE') {
                    // A ticket has been closed by the admins...
                    if (!$ticket.length) { return; }
                    $ticket.addClass('cp-support-list-closed');
                    $ticket.append(APP.support.makeCloseMessage(content, hash));
                    reorder();
                    return;
                }
                if (msg.type !== 'TICKET') { return; }
                $ticket.removeClass('cp-support-list-closed');

                if (!$ticket.length) {
                    $ticket = APP.support.makeTicket($div, content, function (hideButton) {
                        // the ticket will still be displayed until the worker confirms its deletion
                        // so make it unclickable in the meantime
                        hideButton.setAttribute('disabled', true);
                        var error = false;
                        nThen(function (w) {
                            hashesById[id].forEach(function (d) {
                                common.mailbox.dismiss(d, w(function (err) {
                                    if (err) {
                                        error = true;
                                        console.error(err);
                                    }
                                }));
                            });
                        }).nThen(function () {
                            if (!error) {
                                $ticket.remove();
                                delete hashesById[id];
                                reorder();
                                return;
                            }
                            // if deletion failed then reactivate the button and warn
                            hideButton.removeAttribute('disabled');
                            // and show a generic error message
                            UI.alert(Messages.error);
                        });
                    });
                    makeOpenButton($ticket);
                    if (category !== 'all' && $ticket.attr('data-cat') !== category) {
                        $ticket.hide();
                    }
                }
                $ticket.append(APP.support.makeMessage(content, hash));
                reorder();

                if (linkedId) { to(); }
            }
        });
        return $container;
    };

    create['support-priv'] = function () {
        if (!supportKey || !APP.privateKey || !checkAdminKey(APP.privateKey)) { return; }

        var $div = makeBlock('support-priv', true); // Msg.admin_supportPrivHint, .admin_supportPrivTitle, .admin_supportPrivButton
        var $button = $div.find('button').click(function () {
            $button.remove();
            var $selectable = $(UI.dialog.selectable(APP.privateKey)).css({ 'max-width': '28em' });
            $div.append($selectable);
        });
        return $div;
    };
    create['support-init'] = function () {
        var $div = makeBlock('support-init'); // Msg.admin_supportInitHint, .admin_supportInitTitle
        if (!supportKey) {
            (function () {
                $div.append(h('p', Messages.admin_supportInitHelp));
                var button = h('button.btn.btn-primary', Messages.admin_supportInitGenerate);
                var $button = $(button).appendTo($div);
                $div.append($button);
                var spinner = UI.makeSpinner($div);
                $button.click(function () {
                    spinner.spin();
                    $button.attr('disabled', 'disabled');
                    var keyPair = Nacl.box.keyPair();
                    var pub = Nacl.util.encodeBase64(keyPair.publicKey);
                    var priv = Nacl.util.encodeBase64(keyPair.secretKey);
                    // Store the private key first. It won't be used until the decree is accepted.
                    sFrameChan.query("Q_ADMIN_MAILBOX", priv, function (err, obj) {
                        if (err || (obj && obj.error)) {
                            console.error(err || obj.error);
                            UI.warn(Messages.error);
                            spinner.hide();
                            return;
                        }
                        // Then send the decree
                        sFrameChan.query('Q_ADMIN_RPC', {
                            cmd: 'ADMIN_DECREE',
                            data: ['SET_SUPPORT_MAILBOX', [pub]]
                        }, function (e, response) {
                            $button.removeAttr('disabled');
                            if (e || response.error) {
                                UI.warn(Messages.error);
                                console.error(e, response);
                                spinner.hide();
                                return;
                            }
                            spinner.done();
                            UI.log(Messages.saved);
                            supportKey = pub;
                            APP.privateKey = priv;
                            $('.cp-admin-support-init').hide();
                            APP.$rightside.append(create['support-list']());
                            APP.$rightside.append(create['support-priv']());
                        });
                    });
                });
            })();
            return $div;
        }
        if (!APP.privateKey || !checkAdminKey(APP.privateKey)) {
            $div.append(h('p', Messages.admin_supportInitPrivate));

            var error = h('div.cp-admin-support-error');
            var input = h('input.cp-admin-add-private-key');
            var button = h('button.btn.btn-primary', Messages.admin_supportAddKey);

            if (APP.privateKey && !checkAdminKey(APP.privateKey)) {
                $(error).text(Messages.admin_supportAddError);
            }

            $div.append(h('div', [
                error,
                input,
                button
            ]));

            $(button).click(function () {
                var key = $(input).val();
                if (!checkAdminKey(key)) {
                    $(input).val('');
                    return void $(error).text(Messages.admin_supportAddError);
                }
                sFrameChan.query("Q_ADMIN_MAILBOX", key, function () {
                    APP.privateKey = key;
                    $('.cp-admin-support-init').hide();
                    APP.$rightside.append(create['support-list']());
                    APP.$rightside.append(create['support-priv']());
                });
            });
            return $div;
        }
        return;
    };

    var getApi = function (cb) {
        return function () {
            require(['/api/broadcast?'+ (+new Date())], function (Broadcast) {
                cb(Broadcast);
                setTimeout(function () {
                    try {
                        var ctx = require.s.contexts._;
                        var defined = ctx.defined;
                        Object.keys(defined).forEach(function (href) {
                            if (/^\/api\/broadcast\?[0-9]{13}/.test(href)) {
                                delete defined[href];
                                return;
                            }
                        });
                    } catch (e) {}
                });
            });
        };
    };

    // Update the lastBroadcastHash in /api/broadcast if we can do it.
    // To do so, find the last "BROADCAST_CUSTOM" in the current history and use the previous
    // message's hash.
    // If the last BROADCAST_CUSTOM has been deleted by an admin, we can use the most recent
    // message's hash.
    var checkLastBroadcastHash = function () {
        var deleted = [];

        require(['/api/broadcast?'+ (+new Date())], function (BCast) {
            var hash = BCast.lastBroadcastHash || '1'; // Truthy value if no lastKnownHash
            common.mailbox.getNotificationsHistory('broadcast', null, hash, function (e, msgs) {
                if (e) { return void console.error(e); }

                // No history, nothing to change
                if (!Array.isArray(msgs)) { return; }
                if (!msgs.length) { return; }

                var lastHash;
                var next = false;

                // Start from the most recent messages until you find a CUSTOM message and
                // check if it has been deleted
                msgs.reverse().some(function (data) {
                    var c = data.content;

                    // This is the hash we want to keep
                    if (next) {
                        if (!c || !c.hash) { return; }
                        lastHash = c.hash;
                        next = false;
                        return true;
                    }

                    // initialize with the most recent hash
                    if (!lastHash && c && c.hash) { lastHash = c.hash; }

                    var msg = c && c.msg;
                    if (!msg) { return; }

                    // Remember all deleted messages
                    if (msg.type === "BROADCAST_DELETE") {
                        deleted.push(Util.find(msg, ['content', 'uid']));
                    }

                    // Only check custom messages
                    if (msg.type !== "BROADCAST_CUSTOM") { return; }

                    // If the most recent CUSTOM message has been deleted, it means we don't
                    // need to keep any message and we can continue with lastHash as the most
                    // recent broadcast message.
                    if (deleted.indexOf(msg.uid) !== -1) { return true; }

                    // We just found the oldest message we want to keep, move one iteration
                    // further into the loop to get the next message's hash.
                    // If this is the end of the loop, don't bump lastBroadcastHash at all.
                    next = true;
                });

                // If we don't have to bump our lastBroadcastHash, abort
                if (next) { return; }

                // Otherwise, bump to lastHash
                console.warn('Updating last broadcast hash to', lastHash);
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_LAST_BROADCAST_HASH', [lastHash]]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                        return;
                    }
                    console.log('lastBroadcastHash updated');
                });
            });
        });

    };

    create['broadcast'] = function () {
        var key = 'broadcast';
        var $div = makeBlock(key); // Msg.admin_broadcastHint, admin_broadcastTitle

        var form = h('div.cp-admin-broadcast-form');
        var $form = $(form).appendTo($div);

        var refresh = getApi(function (Broadcast) {
            var button = h('button.btn.btn-primary', Messages.admin_broadcastButton);
            var $button = $(button);
            var removeButton = h('button.btn.btn-danger', Messages.admin_broadcastCancel);
            var active = h('div.cp-broadcast-active', h('p', Messages.admin_broadcastActive));
            var $active = $(active);
            var activeUid;
            var deleted = [];

            // Render active message (if there is one)
            var hash = Broadcast.lastBroadcastHash || '1'; // Truthy value if no lastKnownHash
            common.mailbox.getNotificationsHistory('broadcast', null, hash, function (e, msgs) {
                if (e) { return void console.error(e); }
                if (!Array.isArray(msgs)) { return; }
                if (!msgs.length) {
                    $active.hide();
                }
                msgs.reverse().some(function (data) {
                    var c = data.content;
                    var msg = c && c.msg;
                    if (!msg) { return; }
                    if (msg.type === "BROADCAST_DELETE") {
                        deleted.push(Util.find(msg, ['content', 'uid']));
                    }
                    if (msg.type !== "BROADCAST_CUSTOM") { return; }
                    if (deleted.indexOf(msg.uid) !== -1) { return true; }

                    // We found an active custom message, show it
                    var el = common.mailbox.createElement(data);
                    var table = h('table.cp-broadcast-delete');
                    var $table = $(table);
                    var uid = Util.find(data, ['content', 'msg', 'uid']);
                    var time = Util.find(data, ['content', 'msg', 'content', 'time']);
                    var tr = h('tr', { 'data-uid': uid }, [
                        h('td', 'ID: '+uid),
                        h('td', new Date(time || 0).toLocaleString()),
                        h('td', el),
                        h('td.delete', removeButton),
                    ]);
                    $table.append(tr);
                    $active.append(table);
                    activeUid = uid;

                    return true;
                });
                if (!activeUid) { $active.hide(); }
            });

            // Custom message
            var container = h('div.cp-broadcast-container');
            var $container = $(container);
            var languages = Messages._languages;
            var keys = Object.keys(languages).sort();

            // Always keep the textarea ordered by language code
            var reorder = function () {
                $container.find('.cp-broadcast-lang').each(function (i, el) {
                    var $el = $(el);
                    var l = $el.attr('data-lang');
                    $el.css('order', keys.indexOf(l));
                });
            };

            // Remove a textarea
            var removeLang = function (l) {
                $container.find('.cp-broadcast-lang[data-lang="'+l+'"]').remove();

                var hasDefault = $container.find('.cp-broadcast-lang .cp-checkmark input:checked').length;
                if (!hasDefault) {
                    $container.find('.cp-broadcast-lang').first().find('.cp-checkmark input').prop('checked', 'checked');
                }
            };

            var getData = function () { return false; };
            var onPreview = function (l) {
                var data = getData();
                if (data === false) { return void UI.warn(Messages.error); }

                var msg = {
                    uid: Util.uid(),
                    type: 'BROADCAST_CUSTOM',
                    content: data
                };
                common.mailbox.onMessage({
                    lang: l,
                    type: 'broadcast',
                    content: {
                        msg: msg,
                        hash: 'LOCAL|' + JSON.stringify(msg).slice(0,58)
                    }
                }, function () {
                    UI.log(Messages.saved);
                });
            };

            // Add a textarea
            var addLang = function (l) {
                if ($container.find('.cp-broadcast-lang[data-lang="'+l+'"]').length) { return; }
                var preview = h('button.btn.btn-secondary', Messages.broadcast_preview);
                $(preview).click(function () {
                    onPreview(l);
                });
                var bcastDefault = Messages.broadcast_defaultLanguage;
                var first = !$container.find('.cp-broadcast-lang').length;
                var radio = UI.createRadio('broadcastDefault', null, bcastDefault, first, {
                    'data-lang': l,
                    label: {class: 'noTitle'}
                });
                $container.append(h('div.cp-broadcast-lang', { 'data-lang': l }, [
                    h('h4', languages[l]),
                    h('label', Messages.kanban_body),
                    h('textarea'),
                    radio,
                    preview
                ]));
                reorder();
            };

            // Checkboxes to select translations
            var boxes = keys.map(function (l) {
                var $cbox = $(UI.createCheckbox('cp-broadcast-custom-lang-'+l,
                    languages[l], false, { label: { class: 'noTitle' } }));
                var $check = $cbox.find('input').on('change', function () {
                    var c = $check.is(':checked');
                    if (c) { return void addLang(l); }
                    removeLang(l);
                });
                if (l === 'en') {
                    setTimeout(function () {
                        $check.click();
                    });
                }
                return $cbox[0];
            });

            // Extract form data
            getData = function () {
                var map = {};
                var defaultLanguage;
                var error = false;
                $container.find('.cp-broadcast-lang').each(function (i, el) {
                    var $el = $(el);
                    var l = $el.attr('data-lang');
                    if (!l) { error = true; return; }
                    var text = $el.find('textarea').val();
                    if (!text.trim()) { error = true; return; }
                    if ($el.find('.cp-checkmark input').is(':checked')) {
                        defaultLanguage = l;
                    }
                    map[l] = text;
                });
                if (!Object.keys(map).length) {
                    console.error('You must select at least one language');
                    return false;
                }
                if (error) {
                    console.error('One of the selected languages has no data');
                    return false;
                }
                return {
                    defaultLanguage: defaultLanguage,
                    content: map
                };
            };

            var send = function (data) {
                $button.prop('disabled', 'disabled');
                //data.time = +new Date(); // FIXME not used anymore?
                common.mailbox.sendTo('BROADCAST_CUSTOM', data, {}, function (err) {
                    if (err) {
                        $button.prop('disabled', '');
                        console.error(err);
                        return UI.warn(Messages.error);
                    }
                    UI.log(Messages.saved);
                    refresh();

                    checkLastBroadcastHash();
                });
            };

            $button.click(function () {
                var data = getData();
                if (data === false) { return void UI.warn(Messages.error); }
                send(data);
            });

            UI.confirmButton(removeButton, {
                classes: 'btn-danger',
            }, function () {
                if (!activeUid) { return; }
                common.mailbox.sendTo('BROADCAST_DELETE', {
                    uid: activeUid
                }, {}, function (err) {
                    if (err) { return UI.warn(Messages.error); }
                    UI.log(Messages.saved);
                    refresh();
                    checkLastBroadcastHash();
                });
            });

            // Make the form
            $form.empty().append([
                active,
                h('label', Messages.broadcast_translations),
                h('div.cp-broadcast-languages', boxes),
                container,
                h('div.cp-broadcast-form-submit', [
                    h('br'),
                    button
                ])
            ]);
        });
        refresh();

        return $div;
    };

    create['maintenance'] = function () {
        var key = 'maintenance';
        var $div = makeBlock(key); // Msg.admin_maintenanceHint, admin_maintenanceTitle

        var form = h('div.cp-admin-broadcast-form');
        var $form = $(form).appendTo($div);

        var refresh = getApi(function (Broadcast) {
            var button = h('button.btn.btn-primary', Messages.admin_maintenanceButton);
            var $button = $(button);
            var removeButton = h('button.btn.btn-danger', Messages.admin_maintenanceCancel);
            var active;

            if (Broadcast && Broadcast.maintenance) {
                var m = Broadcast.maintenance;
                if (m.start && m.end && m.end >= (+new Date())) {
                    active = h('div.cp-broadcast-active', [
                        UI.setHTML(h('p'), Messages._getKey('broadcast_maintenance', [
                            new Date(m.start).toLocaleString(),
                            new Date(m.end).toLocaleString(),
                        ])),
                        removeButton
                    ]);
                }
            }

            // Start and end date pickers
            var start = h('input');
            var end = h('input');
            var $start = $(start);
            var $end = $(end);
            var is24h = UIElements.is24h();
            var dateFormat = "Y-m-d H:i";
            if (!is24h) { dateFormat = "Y-m-d h:i K"; }

            var endPickr = Flatpickr(end, {
                enableTime: true,
                time_24hr: is24h,
                dateFormat: dateFormat,
                minDate: new Date()
            });
            Flatpickr(start, {
                enableTime: true,
                time_24hr: is24h,
                minDate: new Date(),
                dateFormat: dateFormat,
                onChange: function () {
                    endPickr.set('minDate', new Date($start.val()));
                }
            });

            // Extract form data
            var getData = function () {
                var start = +new Date($start.val());
                var end = +new Date($end.val());
                if (isNaN(start) || isNaN(end)) {
                    console.error('Invalid dates');
                    return false;
                }
                return {
                    start: start,
                    end: end
                };
            };

            var send = function (data) {
                $button.prop('disabled', 'disabled');
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_MAINTENANCE', [data]]
                }, function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        console.error(e, response);
                        $button.prop('disabled', '');
                        return;
                    }
                    // Maintenance applied, send notification
                    common.mailbox.sendTo('BROADCAST_MAINTENANCE', {}, {}, function () {
                        refresh();
                        checkLastBroadcastHash();
                    });
                });

            };
            $button.click(function () {
                var data = getData();
                if (data === false) { return void UI.warn(Messages.error); }
                send(data);
            });
            UI.confirmButton(removeButton, {
                classes: 'btn-danger',
            }, function () {
                send("");
            });

            $form.empty().append([
                active,
                h('label', Messages.broadcast_start),
                start,
                h('label', Messages.broadcast_end),
                end,
                h('br'),
                h('div.cp-broadcast-form-submit', [
                    button
                ])
            ]);
        });
        refresh();

        common.makeUniversal('broadcast', {
            onEvent: function (obj) {
                var cmd = obj.ev;
                if (cmd !== "MAINTENANCE") { return; }
                refresh();
            }
        });

        return $div;
    };
    create['survey'] = function () {
        var key = 'survey';
        var $div = makeBlock(key); // Msg.admin_surveyHint, admin_surveyTitle

        var form = h('div.cp-admin-broadcast-form');
        var $form = $(form).appendTo($div);

        var refresh = getApi(function (Broadcast) {
            var button = h('button.btn.btn-primary', Messages.admin_surveyButton);
            var $button = $(button);
            var removeButton = h('button.btn.btn-danger', Messages.admin_surveyCancel);
            var active;

            if (Broadcast && Broadcast.surveyURL) {
                var a = h('a', {href: Broadcast.surveyURL}, Messages.admin_surveyActive);
                $(a).click(function (e) {
                    e.preventDefault();
                    common.openUnsafeURL(Broadcast.surveyURL);
                });
                active = h('div.cp-broadcast-active', [
                    h('p', a),
                    removeButton
                ]);
            }

            // Survey form
            var label = h('label', Messages.broadcast_surveyURL);
            var input = h('input');
            var $input = $(input);

            // Extract form data
            var getData = function () {
                var url = $input.val();
                if (!Util.isValidURL(url)) {
                    console.error('Invalid URL', url);
                    return false;
                }
                return url;
            };

            var send = function (data) {
                $button.prop('disabled', 'disabled');
                sFrameChan.query('Q_ADMIN_RPC', {
                    cmd: 'ADMIN_DECREE',
                    data: ['SET_SURVEY_URL', [data]]
                }, function (e, response) {
                    if (e || response.error) {
                        $button.prop('disabled', '');
                        UI.warn(Messages.error);
                        console.error(e, response);
                        return;
                    }
                    // Maintenance applied, send notification
                    common.mailbox.sendTo('BROADCAST_SURVEY', {
                        url: data
                    }, {}, function () {
                        refresh();
                        checkLastBroadcastHash();
                    });
                });

            };
            $button.click(function () {
                var data = getData();
                if (data === false) { return void UI.warn(Messages.error); }
                send(data);
            });
            UI.confirmButton(removeButton, {
                classes: 'btn-danger',
            }, function () {
                send("");
            });

            $form.empty().append([
                active,
                label,
                input,
                h('br'),
                h('div.cp-broadcast-form-submit', [
                    button
                ])
            ]);
        });
        refresh();

        common.makeUniversal('broadcast', {
            onEvent: function (obj) {
                var cmd = obj.ev;
                if (cmd !== "SURVEY") { return; }
                refresh();
            }
        });

        return $div;
    };

    var onRefreshPerformance = Util.mkEvent();

    create['refresh-performance'] = function () {
        var key = 'refresh-performance';
        var btn = h('button.btn.btn-primary', Messages.oo_refresh);
        var div = h('div.cp-admin-' + key + '.cp-sidebarlayout-element', btn);
        $(btn).click(function () {
            onRefreshPerformance.fire();
        });
        return $(div);
    };

    create['performance-profiling'] = function () {
        var $div = makeBlock('performance-profiling'); // Msg.admin_performanceProfilingHint, .admin_performanceProfilingTitle

        var onRefresh = function () {
            var createBody = function () {
                 return h('div#profiling-chart.cp-charts.cp-bar-table', [
                    h('span.cp-charts-row.heading', [
                        h('span', Messages.admin_performanceKeyHeading),
                        h('span', Messages.admin_performanceTimeHeading),
                        h('span', Messages.admin_performancePercentHeading),
                        //h('span', ''), //Messages.admin_performancePercentHeading),
                    ]),
                ]);
            };

            var body = createBody();
            var appendRow = function (key, time, percent, scaled) {
                //console.log("[%s] %ss running time (%s%)", key, time, percent);
                body.appendChild(h('span.cp-charts-row', [
                    h('span', key),
                    h('span', time),
                    //h('span', percent),
                    h('span.cp-bar-container', [
                        h('span.cp-bar.profiling-percentage', {
                            style: 'width: ' + scaled + '%',
                        }, ' ' ),
                        h('span.profiling-label', percent + '%'),
                    ]),
                ]));
            };
            var process = function (_o) {
                $('#profiling-chart').remove();
                body = createBody();
                var o = _o[0];
                var sorted = Object.keys(o).sort(function (a, b) {
                  if (o[b] - o[a] <= 0) { return -1; }
                  return 1;
                });

                var values = sorted.map(function (k) { return o[k]; });
                var total = 0;
                values.forEach(function (value) { total += value; });
                var max = Math.max.apply(null, values);

                sorted.forEach(function (k) {
                    var percent = Math.floor((o[k] / total) * 1000) / 10;
                    appendRow(k, o[k], percent, (o[k] / max) * 100);
                });
                $div.append(h('div.width-constrained', body));
            };

            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'GET_WORKER_PROFILES',
            }, function (e, data) {
                if (e || data.error) {
                    UI.warn(Messages.error);
                    return void console.error(e, data);
                }
                process(data);
            });
        };

        onRefresh();
        onRefreshPerformance.reg(onRefresh);

        return $div;
    };

    create['enable-disk-measurements'] = makeAdminCheckbox({ // Msg.admin_enableDiskMeasurementsTitle.admin_enableDiskMeasurementsHint
        hintElement: UIElements.setHTML(h('span'), Messages.admin_enableDiskMeasurementsHint),
        key: 'enable-disk-measurements',
        getState: function () {
            return APP.instanceStatus.enableProfiling;
        },
        query: function (val, setState) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['ENABLE_PROFILING', [val]]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                }
                APP.updateStatus(function () {
                    setState(APP.instanceStatus.enableProfiling);
                });
            });
        },
    });

    var isPositiveInteger = function (n) {
        return n && typeof(n) === 'number'  && n % 1 === 0 && n > 0;
    };

    create['bytes-written'] = function () {
        var key = 'bytes-written';
        var $div = makeBlock(key); // Msg.admin_bytesWrittenTitle.admin_bytesWrittenHint

        var duration = APP.instanceStatus.profilingWindow;
        if (!isPositiveInteger(duration)) { duration = 10000; }
        var newDuration = h('input', {type: 'number', min: 0, value: duration});
        var set = h('button.btn.btn-primary', Messages.admin_setDuration);
        $div.append(h('div', [
            h('span.cp-admin-bytes-written-duration', Messages.ui_ms),
            h('div.cp-admin-setlimit-form', [
                newDuration,
                h('nav', [set])
            ])
        ]));

        UI.confirmButton(set, {
            classes: 'btn-primary',
            multiple: true,
            validate: function () {
                var l = parseInt($(newDuration).val());
                if (isNaN(l)) { return false; }
                return true;
            }
        }, function () {
            var d = parseInt($(newDuration).val());
            if (!isPositiveInteger(d)) { return void UI.warn(Messages.error); }

            var data = [d];
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['SET_PROFILING_WINDOW', data]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    return void console.error(e, response);
                }
                $div.find('.cp-admin-bytes-written-duration').text(Messages._getKey('admin_bytesWrittenDuration', [d]));
            });
        });

        return $div;
    };

    create['update-available'] = function () { // Messages.admin_updateAvailableTitle.admin_updateAvailableHint.admin_updateAvailableLabel.admin_updateAvailableButton
        if (!APP.instanceStatus.updateAvailable) { return; }
        var $div = makeBlock('update-available', true);

        var updateURL = 'https://github.com/xwiki-labs/cryptpad/releases/latest';
        if (typeof(APP.instanceStatus.updateAvailable) === 'string') {
            updateURL = APP.instanceStatus.updateAvailable;
        }

        $div.find('button').click(function () {
            common.openURL(updateURL);
        });

        return $div;
    };

    create['checkup'] = function () {
        var $div = makeBlock('checkup', true); // Messages.admin_checkupButton.admin_checkupHint.admin_checkupTitle
        $div.find('button').click(function () {
            common.openURL('/checkup/');
        });
        return $div;
    };

    create['consent-to-contact'] = makeAdminCheckbox({ // Messages.admin_consentToContactTitle.admin_consentToContactHint.admin_consentToContactLabel
        key: 'consent-to-contact',
        getState: function () {
            return APP.instanceStatus.consentToContact;
        },
        query: function (val, setState) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['CONSENT_TO_CONTACT', [val]]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                }
                APP.updateStatus(function () {
                    setState(APP.instanceStatus.consentToContact);
                });
            });
        },
    });

    create['list-my-instance'] = makeAdminCheckbox({ // Messages.admin_listMyInstanceTitle.admin_listMyInstanceHint.admin_listMyInstanceLabel
        key: 'list-my-instance',
        getState: function () {
            return APP.instanceStatus.listMyInstance;
        },
        query: function (val, setState) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['LIST_MY_INSTANCE', [val]]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                }
                APP.updateStatus(function () {
                    setState(APP.instanceStatus.listMyInstance);
                });
            });
        },
    });

    create['provide-aggregate-statistics'] = makeAdminCheckbox({ // Messages.admin_provideAggregateStatisticsTitle.admin_provideAggregateStatisticsHint.admin_provideAggregateStatisticsLabel
        key: 'provide-aggregate-statistics',
        getState: function () {
            return APP.instanceStatus.provideAggregateStatistics;
        },
        query: function (val, setState) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['PROVIDE_AGGREGATE_STATISTICS', [val]]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                }
                APP.updateStatus(function () {
                    setState(APP.instanceStatus.provideAggregateStatistics);
                });
            });
        },
    });

    create['remove-donate-button'] = makeAdminCheckbox({ // Messages.admin_removeDonateButtonTitle.admin_removeDonateButtonHint.admin_removeDonateButtonLabel
        key: 'remove-donate-button',
        getState: function () {
            return APP.instanceStatus.removeDonateButton;
        },
        query: function (val, setState) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['REMOVE_DONATE_BUTTON', [val]]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                }
                APP.updateStatus(function () {
                    setState(APP.instanceStatus.removeDonateButton);
                });
            });
        },
    });

    create['block-daily-check'] = makeAdminCheckbox({ // Messages.admin_blockDailyCheckTitle.admin_blockDailyCheckHint.admin_blockDailyCheckLabel
        key: 'block-daily-check',
        getState: function () {
            return APP.instanceStatus.blockDailyCheck;
        },
        query: function (val, setState) {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['BLOCK_DAILY_CHECK', [val]]
            }, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                }
                APP.updateStatus(function () {
                    setState(APP.instanceStatus.blockDailyCheck);
                });
            });
        },
    });

    var sendDecree = function (data, cb) {
        sFrameChan.query('Q_ADMIN_RPC', {
            cmd: 'ADMIN_DECREE',
            data: data,
        }, cb);
    };

    create['instance-purpose'] = function () {
        var key = 'instance-purpose';
        var $div = makeBlock(key); // Messages.admin_instancePurposeTitle.admin_instancePurposeHint

        var values = [
            'noanswer', // Messages.admin_purpose_noanswer
            'experiment', // Messages.admin_purpose_experiment
            'personal', // Messages.admin_purpose_personal
            'education', // Messages.admin_purpose_education
            'org', // Messages.admin_purpose_org
            'business', // Messages.admin_purpose_business
            'public', // Messages.admin_purpose_public
        ];

        var defaultPurpose = 'noanswer';
        var purpose = APP.instanceStatus.instancePurpose || defaultPurpose;

        var opts = h('div.cp-admin-radio-container', [
            values.map(function (key) {
                var full_key = 'admin_purpose_' + key;
                return UI.createRadio('cp-instance-purpose-radio', 'cp-instance-purpose-radio-'+key,
                    Messages[full_key] || Messages._getKey(full_key, [defaultPurpose]),
                    key === purpose, {
                        input: { value: key },
                        label: { class: 'noTitle' }
                    });
            })
        ]);

        var $opts = $(opts);
        //var $br = $(h('br',));
        //$div.append($br);

        $div.append(opts);

        var setPurpose = function (value, cb) {
            sendDecree([
                'SET_INSTANCE_PURPOSE',
                [ value]
            ], cb);
        };

        $opts.on('change', function () {
            var val = $opts.find('input:radio:checked').val();
            console.log(val);
            //spinner.spin();
            setPurpose(val, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    //spinner.hide();
                    return;
                }
                //spinner.done();
                UI.log(Messages.saved);
            });
        });

        return $div;
    };

    var hideCategories = function () {
        APP.$rightside.find('> div').hide();
    };
    var showCategories = function (cat) {
        hideCategories();
        cat.forEach(function (c) {
            APP.$rightside.find('.'+c).show();
        });
    };

    var SIDEBAR_ICONS = {
        general: 'fa fa-user-o',
        stats: 'fa fa-line-chart',
        quota: 'fa fa-hdd-o',
        support: 'fa fa-life-ring',
        broadcast: 'fa fa-bullhorn',
        performance: 'fa fa-heartbeat',
        network: 'fa fa-sitemap', // or fa-university ?
        database: 'fa fa-database',
    };

    Messages.admin_cat_database = "Database"; // XXX

    var createLeftside = function () {
        var $categories = $('<div>', {'class': 'cp-sidebarlayout-categories'})
                            .appendTo(APP.$leftside);
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var active = privateData.category || 'general';
        if (active.indexOf('-') !== -1) {
            active = active.split('-')[0];
        }
        if (!categories[active]) { active = 'general'; }
        common.setHash(active);
        Object.keys(categories).forEach(function (key) {
            var iconClass = SIDEBAR_ICONS[key];
            var icon;
            if (iconClass) {
                icon = h('span', { class: iconClass });
            }
            var $category = $(h('div', {
                'class': 'cp-sidebarlayout-category'
            }, [
                icon,
                Messages['admin_cat_'+key] || key,
            ])).appendTo($categories);
            if (key === active) {
                $category.addClass('cp-leftside-active');
            }

            $category.click(function () {
                if (!Array.isArray(categories[key]) && categories[key].onClick) {
                    categories[key].onClick();
                    return;
                }
                active = key;
                common.setHash(key);
                $categories.find('.cp-leftside-active').removeClass('cp-leftside-active');
                $category.addClass('cp-leftside-active');
                showCategories(categories[key]);
            });

        });
        showCategories(categories[active]);
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.adminPage || 'Admin',
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
    };

    var updateStatus = APP.updateStatus = function (cb) {
        sFrameChan.query('Q_ADMIN_RPC', {
            cmd: 'INSTANCE_STATUS',
        }, function (e, data) {
            if (e) { console.error(e); return void cb(e); }
            if (!Array.isArray(data)) { return void cb('EINVAL'); }
            APP.instanceStatus = data[0];
            console.log("Status", APP.instanceStatus);
            cb();
        });
    };

    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        APP.$container = $('#cp-sidebarlayout-container');
        APP.$toolbar = $('#cp-toolbar');
        APP.$leftside = $('<div>', {id: 'cp-sidebarlayout-leftside'}).appendTo(APP.$container);
        APP.$rightside = $('<div>', {id: 'cp-sidebarlayout-rightside'}).appendTo(APP.$container);
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (waitFor) {
        updateStatus(waitFor());
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        common.setTabTitle(Messages.adminPage || 'Administration');

        if (!common.isAdmin()) {
            return void UI.errorLoadingScreen(Messages.admin_authError || '403 Forbidden');
        }

        APP.privateKey = privateData.supportPrivateKey;
        APP.origin = privateData.origin;
        APP.readOnly = privateData.readOnly;
        APP.support = Support.create(common, true);


        // Content
        var $rightside = APP.$rightside;
        var addItem = function (cssClass) {
            var item = cssClass.slice(9); // remove 'cp-settings-'
            if (typeof (create[item]) === "function") {
                $rightside.append(create[item]());
            }
        };
        for (var cat in categories) {
            if (!Array.isArray(categories[cat])) { continue; }
            categories[cat].forEach(addItem);
        }

        createLeftside();

        UI.removeLoadingScreen();

    });
});
