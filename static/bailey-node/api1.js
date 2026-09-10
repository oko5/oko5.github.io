/*
=============================================================
 WhatsApp Baileys API
=============================================================

 FEATURES
 ------------------------------------------------------------
 - First run:
     Shows WhatsApp QR directly in terminal
     Ask user to scan QR
     Creates auth.enc after successful login

 - POST /send
     Send text message to a group
     Supports forwardingScore
     Supports forwardedNewsletterMessageInfo

 - POST /list_chan
     Lists available/subscribed WhatsApp Channels
     Shows:
       - channel name
       - newsletter JID
       - description
       - invite/link information
       - verification information
       - follower count
       - mute/follow information where available

 - GET /groups
     Lists WhatsApp groups

 - GET /status
     Connection status

 NO WEBSOCKET
=============================================================
*/

import makeWASocket, {
    DisconnectReason,
    Browsers,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    isJidNewsletter
} from "@whiskeysockets/baileys";

import P from "pino";
import express from "express";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/*
=============================================================
 PATHS
=============================================================
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.join(__dirname, "auth_info");
const AUTH_MARKER = path.join(__dirname, "auth.enc");

/*
=============================================================
 EXPRESS
=============================================================
*/

const app = express();

app.use(
    express.json({
        limit: "10mb"
    })
);

const PORT = 3000;

/*
=============================================================
 GLOBAL SOCKET
=============================================================
*/

let sock = null;
let connectionState = "closed";
let reconnecting = false;

/*
=============================================================
 LOGGER
=============================================================
*/

const logger = P({
    level: "silent"
});

/*
=============================================================
 HELPERS
=============================================================
*/

function authExists() {
    return fs.existsSync(AUTH_MARKER);
}

function createAuthMarker() {
    try {
        fs.writeFileSync(
            AUTH_MARKER,
            JSON.stringify(
                {
                    created: new Date().toISOString(),
                    type: "baileys-auth"
                },
                null,
                2
            )
        );

        console.log(
            "[AUTH] auth.enc created successfully."
        );
    } catch (err) {
        console.error(
            "[AUTH] Failed to create auth.enc:",
            err
        );
    }
}

function normalizeScore(value) {
    const score = Number(value);

    if (!Number.isFinite(score)) {
        return 0;
    }

    return Math.max(
        0,
        Math.floor(score)
    );
}

function cleanString(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
}

/*
=============================================================
 GET GROUPS
=============================================================
*/

async function getGroups() {
    if (!sock) {
        throw new Error(
            "WhatsApp socket is not initialized."
        );
    }

    const groups =
        await sock.groupFetchAllParticipating();

    return Object.values(groups);
}

/*
=============================================================
 FIND GROUP BY NAME
=============================================================
*/

async function findGroupByName(groupName) {
    const groups =
        await getGroups();

    const wanted =
        cleanString(groupName)
            .toLowerCase();

    const found =
        groups.find(
            group =>
                cleanString(group.subject)
                    .toLowerCase() === wanted
        );

    return found || null;
}

/*
=============================================================
 NEWSLETTER / CHANNEL HELPERS
=============================================================
*/

/*
    Try to extract useful information from whatever
    newsletter metadata object Baileys returns.

    Different Baileys versions can expose slightly
    different fields, so this intentionally handles
    several possible property names.
*/

function normalizeNewsletterMetadata(
    metadata,
    fallbackJid = null
) {
    if (!metadata) {
        return {
            newsletterJid: fallbackJid
        };
    }

    const jid =
        metadata.id ||
        metadata.jid ||
        metadata.newsletterJid ||
        fallbackJid ||
        null;

    const name =
        metadata.name ||
        metadata.newsletterName ||
        metadata.thread_metadata?.name ||
        metadata.threadMetadata?.name ||
        null;

    const description =
        metadata.description ||
        metadata.thread_metadata?.description ||
        metadata.threadMetadata?.description ||
        null;

    const invite =
        metadata.invite ||
        metadata.inviteCode ||
        metadata.invite_code ||
        null;

    const picture =
        metadata.picture ||
        metadata.pictureUrl ||
        metadata.preview ||
        null;

    const subscribers =
        metadata.subscribers ||
        metadata.subscriberCount ||
        metadata.followers ||
        metadata.followersCount ||
        null;

    const verification =
        metadata.verification ||
        metadata.verificationState ||
        metadata.verified ||
        null;

    return {
        newsletterJid: jid,
        name,
        description,
        invite,
        picture,
        subscribers,
        verification,
        raw: metadata
    };
}

/*
=============================================================
 LIST SUBSCRIBED NEWSLETTERS
=============================================================
*/

async function getSubscribedNewsletters() {
    if (!sock) {
        throw new Error(
            "WhatsApp socket is not initialized."
        );
    }

    /*
        Different Baileys versions have exposed newsletter
        subscription listing under different APIs.

        Prefer getSubscribedNewsletters if available.
    */

    if (
        typeof sock.getSubscribedNewsletters ===
        "function"
    ) {
        return await sock.getSubscribedNewsletters();
    }

    /*
        Some versions expose newsletterList.
    */

    if (
        typeof sock.newsletterList ===
        "function"
    ) {
        return await sock.newsletterList();
    }

    /*
        Some builds may expose newsletterMetadata
        but not a direct listing API.

        In that case we cannot magically enumerate
        every WhatsApp channel without a source of JIDs.
    */

    return null;
}

/*
=============================================================
 RESOLVE ONE NEWSLETTER
=============================================================
*/

async function resolveNewsletter(
    input
) {
    const value =
        cleanString(input);

    if (!value) {
        throw new Error(
            "Channel JID or invite code is required."
        );
    }

    /*
        Already a newsletter JID
    */

    if (
        value.endsWith("@newsletter")
    ) {
        if (
            typeof sock.newsletterMetadata !==
            "function"
        ) {
            throw new Error(
                "This Baileys version does not expose newsletterMetadata()."
            );
        }

        const metadata =
            await sock.newsletterMetadata(
                "jid",
                value
            );

        return normalizeNewsletterMetadata(
            metadata,
            value
        );
    }

    /*
        Treat it as an invite code.
    */

    if (
        typeof sock.newsletterMetadata !==
        "function"
    ) {
        throw new Error(
            "This Baileys version does not expose newsletterMetadata()."
        );
    }

    const metadata =
        await sock.newsletterMetadata(
            "invite",
            value
        );

    return normalizeNewsletterMetadata(
        metadata
    );
}

/*
=============================================================
 POST /list_chan
=============================================================

 Examples:

 1.
 POST /list_chan

 {}

 This attempts to list subscribed newsletters.

 2.
 POST /list_chan

 {
   "jid": "120363373720969525@newsletter"
 }

 Returns detailed metadata for that channel.

 3.
 POST /list_chan

 {
   "invite": "0029V..."
 }

 Resolves an invite code into channel metadata.
=============================================================
*/

app.post(
    "/list_chan",
    async (req, res) => {
        try {
            if (!sock) {
                return res.status(503).json({
                    success: false,
                    error:
                        "WhatsApp is not connected."
                });
            }

            const jid =
                cleanString(
                    req.body?.jid
                );

            const invite =
                cleanString(
                    req.body?.invite
                );

            /*
                -------------------------------------------------
                MODE 1:
                Specific newsletter JID
                -------------------------------------------------
            */

            if (jid) {
                if (
                    !jid.endsWith("@newsletter")
                ) {
                    return res.status(400).json({
                        success: false,
                        error:
                            "jid must end with @newsletter"
                    });
                }

                const channel =
                    await resolveNewsletter(
                        jid
                    );

                return res.json({
                    success: true,
                    mode: "single",
                    channel
                });
            }

            /*
                -------------------------------------------------
                MODE 2:
                Invite code
                -------------------------------------------------
            */

            if (invite) {
                const channel =
                    await resolveNewsletter(
                        invite
                    );

                return res.json({
                    success: true,
                    mode: "invite",
                    channel
                });
            }

            /*
                -------------------------------------------------
                MODE 3:
                List subscribed channels
                -------------------------------------------------
            */

            const result =
                await getSubscribedNewsletters();

            /*
                If the installed Baileys version does not
                expose an enumeration method, tell the caller
                instead of pretending we found channels.
            */

            if (!result) {
                return res.status(501).json({
                    success: false,
                    error:
                        "This installed Baileys version does not expose a subscribed-newsletter listing method.",
                    supported:
                        [
                            "POST /list_chan with { \"jid\": \"...@newsletter\" }",
                            "POST /list_chan with { \"invite\": \"...\" }"
                        ]
                });
            }

            /*
                -------------------------------------------------
                Normalize result
                -------------------------------------------------
            */

            let entries = [];

            if (Array.isArray(result)) {
                entries = result;
            } else if (
                result &&
                typeof result === "object"
            ) {
                entries =
                    Object.values(result);
            }

            const channels = [];

            for (
                const item of entries
            ) {
                try {
                    const normalized =
                        normalizeNewsletterMetadata(
                            item
                        );

                    channels.push(
                        normalized
                    );
                } catch (
                    normalizeError
                ) {
                    channels.push({
                        newsletterJid:
                            item?.id ||
                            item?.jid ||
                            item?.newsletterJid ||
                            null,
                        raw: item,
                        normalizeError:
                            normalizeError.message
                    });
                }
            }

            return res.json({
                success: true,
                mode: "subscribed",
                count:
                    channels.length,
                channels
            });

        } catch (err) {
            console.error(
                "[LIST_CHAN]",
                err
            );

            return res.status(500).json({
                success: false,
                error:
                    err?.message ||
                    String(err)
            });
        }
    }
);

/*
=============================================================
 POST /send
=============================================================

 BODY:

 {
   "group": "My Group",
   "message": "Hello",
   "forwardingScore": 3
 }

 Optional:

 {
   "group": "My Group",
   "message": "Hello",
   "forwardingScore": 3,
   "newsletterJid":
       "120363373720969525@newsletter",
   "serverMessageId": 1,
   "newsletterName":
       "✧ 𝐄𝐭𝐞𝐫𝐧𝐚𝐥 𝐢𝐧𝐜 ✧"
 }

=============================================================
*/

app.post(
    "/send",
    async (req, res) => {
        try {
            if (!sock) {
                return res.status(503).json({
                    success: false,
                    error:
                        "WhatsApp is not connected."
                });
            }

            const group =
                cleanString(
                    req.body?.group
                );

            const message =
                cleanString(
                    req.body?.message
                );

            const score =
                normalizeScore(
                    req.body?.forwardingScore
                );

            /*
                Newsletter information
            */

            const newsletterJid =
                cleanString(
                    req.body?.newsletterJid
                );

            const newsletterName =
                cleanString(
                    req.body?.newsletterName
                );

            const serverMessageId =
                Number(
                    req.body?.serverMessageId
                );

            if (!group) {
                return res.status(400).json({
                    success: false,
                    error:
                        "group is required."
                });
            }

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error:
                        "message is required."
                });
            }

            /*
                Find actual group.
            */

            const groupInfo =
                await findGroupByName(
                    group
                );

            if (!groupInfo) {
                return res.status(404).json({
                    success: false,
                    error:
                        `Group not found: ${group}`
                });
            }

            /*
                Build contextInfo.
            */

            const contextInfo = {
                forwardingScore:
                    score,

                isForwarded:
                    score > 0
            };

            /*
                Only add forwardedNewsletterMessageInfo
                when a newsletter JID was explicitly supplied.
            */

            if (
                newsletterJid &&
                newsletterJid.endsWith(
                    "@newsletter"
                )
            ) {
                contextInfo.forwardedNewsletterMessageInfo =
                    {
                        newsletterJid:
                            newsletterJid,

                        serverMessageId:
                            Number.isFinite(
                                serverMessageId
                            )
                                ? serverMessageId
                                : 1,

                        newsletterName:
                            newsletterName ||
                            undefined
                    };
            }

            /*
                Remove undefined values.
            */

            if (
                contextInfo
                    .forwardedNewsletterMessageInfo
            ) {
                Object.keys(
                    contextInfo.forwardedNewsletterMessageInfo
                ).forEach(key => {
                    if (
                        contextInfo
                            .forwardedNewsletterMessageInfo[
                            key
                        ] === undefined
                    ) {
                        delete contextInfo
                            .forwardedNewsletterMessageInfo[
                            key
                        ];
                    }
                });
            }

            /*
                SEND
            */

            const sent =
                await sock.sendMessage(
                    groupInfo.id,
                    {
                        text: message,

                        contextInfo
                    }
                );

            return res.json({
                success: true,

                group: {
                    name:
                        groupInfo.subject,
                    jid:
                        groupInfo.id
                },

                message: {
                    text: message,
                    forwardingScore:
                        score,
                    isForwarded:
                        score > 0
                },

                newsletter:
                    contextInfo
                        .forwardedNewsletterMessageInfo ||
                    null,

                messageId:
                    sent?.key?.id ||
                    null
            });

        } catch (err) {
            console.error(
                "[SEND]",
                err
            );

            return res.status(500).json({
                success: false,
                error:
                    err?.message ||
                    String(err)
            });
        }
    }
);

/*
=============================================================
 GET /groups
=============================================================
*/

app.get(
    "/groups",
    async (req, res) => {
        try {
            if (!sock) {
                return res.status(503).json({
                    success: false,
                    error:
                        "WhatsApp is not connected."
                });
            }

            const groups =
                await getGroups();

            const result =
                groups.map(
                    group => ({
                        name:
                            group.subject,
                        jid:
                            group.id,
                        owner:
                            group.owner ||
                            null,
                        creation:
                            group.creation ||
                            null,
                        size:
                            Array.isArray(
                                group.participants
                            )
                                ? group.participants.length
                                : 0
                    })
                );

            return res.json({
                success: true,
                count:
                    result.length,
                groups:
                    result
            });

        } catch (err) {
            console.error(
                "[GROUPS]",
                err
            );

            return res.status(500).json({
                success: false,
                error:
                    err?.message ||
                    String(err)
            });
        }
    }
);

/*
=============================================================
 GET /status
=============================================================
*/

app.get(
    "/status",
    async (req, res) => {
        return res.json({
            success: true,

            connected:
                connectionState ===
                "open",

            connection:
                connectionState,

            authMarker:
                authExists(),

            authDirectory:
                fs.existsSync(
                    AUTH_DIR
                )
        });
    }
);

/*
=============================================================
 WHATSAPP CONNECTION
=============================================================
*/

async function startWhatsApp() {
    if (reconnecting) {
        return;
    }

    reconnecting = true;

    try {
        console.log(
            "================================================="
        );

        console.log(
            "[WA] Starting WhatsApp..."
        );

        console.log(
            "================================================="
        );

        const {
            state,
            saveCreds
        } =
            await useMultiFileAuthState(
                AUTH_DIR
            );

        sock =
            makeWASocket({
                auth: {
                    creds:
                        state.creds,

                    keys:
                        makeCacheableSignalKeyStore(
                            state.keys,
                            logger
                        )
                },

                logger,

                browser:
                    Browsers.ubuntu(
                        "WhatsApp API"
                    ),

                syncFullHistory:
                    false,

                markOnlineOnConnect:
                    false,

                generateHighQualityLinkPreview:
                    false
            });

        /*
            Save credentials.
        */

        sock.ev.on(
            "creds.update",
            saveCreds
        );

        /*
            Connection updates.
        */

        sock.ev.on(
            "connection.update",
            async update => {
                const {
                    connection,
                    lastDisconnect,
                    qr
                } = update;

                /*
                    QR CODE
                */

                if (qr) {
                    console.log(
                        ""
                    );

                    console.log(
                        "================================================="
                    );

                    console.log(
                        "[WA] SCAN THIS QR CODE"
                    );

                    console.log(
                        "[WA] Open WhatsApp -> Linked Devices -> Link a Device"
                    );

                    console.log(
                        "================================================="
                    );

                    qrcode.generate(
                        qr,
                        {
                            small: true
                        }
                    );

                    console.log(
                        "================================================="
                    );
                }

                /*
                    CONNECTED
                */

                if (
                    connection ===
                    "open"
                ) {
                    connectionState =
                        "open";

                    reconnecting =
                        false;

                    console.log(
                        ""
                    );

                    console.log(
                        "================================================="
                    );

                    console.log(
                        "[WA] CONNECTED"
                    );

                    console.log(
                        `[WA] Logged in as: ${
                            sock.user?.name ||
                            "Unknown"
                        }`
                    );

                    console.log(
                        `[WA] JID: ${
                            sock.user?.id ||
                            "Unknown"
                        }`
                    );

                    console.log(
                        "================================================="
                    );

                    /*
                        Create auth.enc only after
                        successful login.
                    */

                    if (
                        !authExists()
                    ) {
                        createAuthMarker();
                    }
                }

                /*
                    CLOSED
                */

                if (
                    connection ===
                    "close"
                ) {
                    connectionState =
                        "closed";

                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode;

                    const loggedOut =
                        statusCode ===
                        DisconnectReason.loggedOut;

                    console.log(
                        `[WA] Connection closed. Code: ${statusCode}`
                    );

                    /*
                        Do not reconnect if the
                        WhatsApp account explicitly logged out.
                    */

                    if (
                        loggedOut
                    ) {
                        console.error(
                            "[WA] Logged out from WhatsApp."
                        );

                        console.error(
                            "[WA] Delete auth_info and auth.enc if you want to link another account."
                        );

                        reconnecting =
                            false;

                        return;
                    }

                    /*
                        Reconnect automatically.
                    */

                    reconnecting =
                        false;

                    console.log(
                        "[WA] Reconnecting in 3 seconds..."
                    );

                    setTimeout(
                        () => {
                            startWhatsApp()
                                .catch(
                                    console.error
                                );
                        },
                        3000
                    );
                }
            }
        );

    } catch (err) {
        reconnecting =
            false;

        connectionState =
            "closed";

        console.error(
            "[WA] Failed to start:",
            err
        );

        console.log(
            "[WA] Retrying in 5 seconds..."
        );

        setTimeout(
            () => {
                startWhatsApp()
                    .catch(
                        console.error
                    );
            },
            5000
        );
    }
}

/*
=============================================================
 START HTTP SERVER
=============================================================
*/

app.listen(
    PORT,
    "127.0.0.1",
    () => {
        console.log(
            ""
        );

        console.log(
            "================================================="
        );

        console.log(
            " WhatsApp Baileys API"
        );

        console.log(
            "================================================="
        );

        console.log(
            `API: http://127.0.0.1:${PORT}`
        );

        console.log(
            ""
        );

        console.log(
            "Endpoints:"
        );

        console.log(
            `  GET  /status`
        );

        console.log(
            `  GET  /groups`
        );

        console.log(
            `  POST /send`
        );

        console.log(
            `  POST /list_chan`
        );

        console.log(
            ""
        );

        console.log(
            `auth.enc exists: ${authExists()}`
        );

        console.log(
            "================================================="
        );

        startWhatsApp()
            .catch(
                console.error
            );
    }
);
