'use strict';

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const https = require('httpolyglot');
const config = require('./config');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const callTools = require('./callTools')

const app = express();

const options = {
    key: fs.readFileSync(config.sslKey, 'utf-8'),
    cert: fs.readFileSync(config.sslCrt, 'utf-8'),
};

const httpsServer = https.createServer(options, app);

let chatGPT;
if (config.chatGPT.enabled) {
    if (config.chatGPT.apiKey) {
        const { OpenAI } = require('openai');
        const configuration = {
            basePath: config.chatGPT.basePath,
            apiKey: config.chatGPT.apiKey,
        };
        chatGPT = new OpenAI(configuration);
    }
}

app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

app.post('/listvoices', async (req, res) => {
    if (!config.videoAi.enabled && !config.videoAi.apiKey) return res.json({'error': 'Video AI seems disabled, try later!'});
    try {
        const response = await fetch(`${config.videoAi.serverUrl}/v2/voices`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': config.videoAi.apiKey,
            }
        });
        if (response.status === 500) {
            res.json({'error': 'server error'});
        } else {
            const data = await response.json();
            res.json(data);
        }
    } catch (error) {
        res.json({'error': 'server error'});
    }
});

app.post('/listelevenvoices', async (req, res) => {
    if (!config.elevenLabs || (!config.elevenLabs.enabled && !config.elevenLabs.apiKey)) return res.json({ 'error': 'ElevenLabs AI seems disabled, try later!' });
    try {
        const response = await fetch(`${config.elevenLabs.serverUrl}/v1/voices?show_legacy=true`, {
            method: 'GET',
            headers: {
                'accept':'application / json',
                'xi-api-key': config.elevenLabs.apiKey,
                'content-type': 'application/json'
            }
        });
        if (response.status === 500) {
            res.json({'error': 'server error'});
        } else {
            const data = await response.json();
            res.json(data);
        }
    } catch (error) {
        res.json({'error': 'server error'});
    }
});

app.post('/deletevoice', async (req, res) => {
    try {
        const session_id = req.body.session_id;
        const filePath = '../server/audiofiles/' + session_id + '.mp3';
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Error removing file: ${err}`);
                return;
            }
        });
    } catch (error) {
        res.json({ 'error': 'server error' });
    }
});

app.post('/getvoice', async (req, res) => {
    if (!config.elevenLabs || (!config.elevenLabs.enabled && !config.elevenLabs.apiKey)) return res.json({ 'error': 'ElevenLabs AI seems disabled, try later!' });
    try {
        const text = req.body.text;
        const voiceId = req.body.voice;
        const elevenLab = config.elevenLabs.apiKey;
        const model_id = config.elevenLabs.model;
        const session_id = req.body.session_id;
        let decodedString = '';
        if (req.body.elabs) {
            let bufferObj = Buffer.from(req.body.elabs, 'base64');
            decodedString = bufferObj.toString('utf8');
        }
        const elevenLabKey = (decodedString) ? decodedString : elevenLab;
        const response = await fetch(`${config.elevenLabs.serverUrl}/v1/text-to-speech/${voiceId}/stream`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'xi-api-key': elevenLabKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({ model_id, text }),
        });
        if (response.status === 500) {
            res.json({ 'error': 'server error' });
        } else {
            const data = await response.json();
            fs.writeFile('../server/audiofiles/' + session_id + '.mp3', data, err => {
                //
            });
        }
    } catch ({ name, message }) {
        res.json({ 'error': 'server error' });
    }
});

app.post('/listassistants', async (req, res) => {
    if (!config.videoAi.enabled && !config.videoAi.apiKey) return res.json({'error': 'Video AI seems disabled, try later!'});
    try {
        const response = await chatGPT.beta.assistants.list();
        if (response.data) {
            res.json(response.data);
        } else {
            res.json({'error': 'server error'});
        }
    } catch (error) {
        res.json({'error': 'server error'});
    }
});

app.post('/createtoken', async (req, res) => {
    if (!config.videoAi.enabled && !config.videoAi.apiKey) return res.json({'error': 'Video AI seems disabled, try later!'});

    const heygen = (config.videoAi.apiKeyStream) ? config.videoAi.apiKeyStream : config.videoAi.apiKey;
    let decodedString = '';
    if (req.body.hg) {
        let bufferObj = Buffer.from(req.body.hg, 'base64');
        decodedString = bufferObj.toString('utf8');
    }
    const heygenKey = (decodedString) ? decodedString : heygen;

    try {
        if (req.body.system) {
            config.videoAi.systemLimit = system;
        }
        const quality = req.body.quality;
        const avatar_name = req.body.avatar_name;
        const voice_id = req.body.voice_id;
        const response = await fetch(`${config.videoAi.serverUrl}/v1/streaming.create_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': heygenKey,
            }
        });
        if (response.status === 500) {
            res.json({'error': 'server error'});
        } else {
            const data = await response.json();
            res.json(data);
        }
    } catch ({ name, message }) {
        res.json({'error': 'server error'});
    }
});

let splitText = '';
let some = '';
function getSegment(segmentArr, count) {
    if (segmentArr.length > 0) {
        let text = segmentArr[0];
        if (some.length < count) {
            some += text;
            splitText += text;
        } else {
            some = '';
            splitText += text + '~';
        }
        segmentArr.shift();
        if (segmentArr.length > 0) {
            getSegment(segmentArr, count);
        }
    }
}

function breakText(string, count) {
    if (string.length < count) {
        return string;
    } else {
        splitText = '';
        const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
        const segments = segmenter.segment(string);

        let segmentArr = Array.from(segments).map((segment) => segment.segment);
        getSegment(segmentArr, count);
        return splitText;
    }
}

app.post('/sendopenai', async (req, res) => {
    if (!config.videoAi.enabled && !config.videoAi.apiKey) return res.json({'error': 'Video AI seems disabled, try later!'});
    try {

        // const systemSetup = "you are a demo streaming avatar from HeyGen, an industry-leading AI generation product that specialize in AI avatars and videos.\nYou are here to showcase how a HeyGen streaming avatar looks and talks.\nPlease note you are not equipped with any specific expertise or industry knowledge yet, which is to be provided when deployed to a real customer's use case.\nAudience will try to have a conversation with you, please try answer the questions or respond their comments naturally, and concisely. - please try your best to response with short answers, limit to one sentence per response, and only answer the last question."
        const systemSetup = req.body.system || config.videoAi.systemLimit;
        const text = req.body.message;
        const tools = req.body.tools;
        const context = req.body.context;
        const isContext = req.body.isContext;
        const model = config.chatGPT.model;
        const maxTokens = config.chatGPT.max_tokens;

        if (isContext) {
            var arr = {
                messages: [
                    ...context,
                    { role: 'system', content: systemSetup},
                    { role: 'user', content: text }
                ],
                model: model,
                max_tokens: maxTokens
            };
        } else {
            arr = {
                messages: [
                    { role: 'system', content: systemSetup},
                    { role: 'user', content: text }
                ],
                model: model,
                max_tokens: maxTokens
            };
        }

        if (tools) {
            const arrToolParam = tools.split('|');

            const toolsNames = arrToolParam[0].split('~');
            const toolsDesciption = arrToolParam[1].split('~');
            const toolsParams = arrToolParam[2].split('~');
            arr.tools = [];
            for (let i = 0; i < toolsNames.length; i++) {
                if (toolsNames[i]) {
                    const arrParams = toolsParams[i].split(',');
                    let par = {};
                    arrParams.forEach((param) => {
                        par[param] = {};
                        par[param].type = 'string';
                    });

                    let callToolsParam = {
                        type: 'function',
                        function: {
                            name: toolsNames[i],
                            description: toolsDesciption[i],
                            parameters: {
                                type: 'object',
                                properties: par,
                                required : [arrParams[0]],
                            },
                        },
                    };
                    arr.tools.push(callToolsParam);
                }
            }
        }

        let chatCompletion = await chatGPT.chat.completions.create(arr);
        let chatText = chatCompletion.choices[0].message.content;
        let background = '', url = '';
        if (chatCompletion.choices[0].message.tool_calls && chatCompletion.choices[0].message.tool_calls.length > 0) {
            var functionName = chatCompletion.choices[0].message.tool_calls[0].function.name;
            var params = chatCompletion.choices[0].message.tool_calls[0].function.arguments;
            params = JSON.parse(params);
            params.url = req.headers.referer;
            params = JSON.stringify(params);
            const resp = await callTools.callFunction(functionName, params, req);
            chatText = resp.text;
            var arr = {
                model: model,
                messages: [
                    { role: 'system', content: systemSetup},
                    ...context,
                    { role: 'user', content: text },
                    { role: 'function', name: functionName, 'content': chatText}
                ]
            };

            chatCompletion = await chatGPT.chat.completions.create(arr);
            if (chatCompletion.choices && chatCompletion.choices[0].message.content) {
                chatText = chatCompletion.choices[0].message.content;
            }

            if (resp.background) {
                background = resp.background;
            }
            if (resp.url) {
                url = resp.url;
            }
        }

        if (chatText) {
            const chatArr = chatText.split('||');
            if (isContext) {
                context.push({ role: 'system', content: chatArr[0] });
                context.push({ role: 'assistant', content: chatArr[0] });
            }
            chatText = breakText(chatArr[0], 550);
            if (chatArr[1]) {
                chatText += '|' + chatArr[1];
            }
            res.json({'status': 200, 'text': chatText, 'context': context, 'background': background, 'url': url});
        } else {
            res.json({'status': 200, 'text': null, 'context': context});
        }
    } catch ({ name, message }) {
        res.json({'error': message});
    }
});

app.post('/sendassistant', async (req, res) => {
    if (!config.videoAi.enabled && !config.videoAi.apiKey) return res.json({'error': 'Video AI seems disabled, try later!'});
    try {
        const text = req.body.message;
        const assistantId = req.body.assistantId;
        const thread = await chatGPT.beta.threads.create({})

        const message = await chatGPT.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: text
        });

        const run = await chatGPT.beta.threads.runs.create(thread.id, {
            assistant_id: assistantId,
        });

        const checkRun = async () => {
            return new Promise((resolve, reject) => {
                const interval = setInterval(async () => {
                    const retrieveRun = await chatGPT.beta.threads.runs.retrieve(
                        thread.id,
                        run.id
                    );
                    if (retrieveRun.status === 'completed') {
                        clearInterval(interval)
                        resolve(retrieveRun)
                    }
                }, 3000);
            })
        }
        await checkRun();
        const messages = await chatGPT.beta.threads.messages.list(thread.id)
        const answer = (messages.data ?? []).find((m) => m?.role === 'assistant')?.content?.[0];

        let chatText = answer.text.value;
        if (chatText) {
            res.json({'status': 200, 'text': chatText});
        } else {
            res.json({'status': 200, 'text': null});
        }
    } catch ({ name, message }) {
        res.json({'error': 'server error'});
    }
});
// ####################################################
// START SERVER
// ####################################################

httpsServer.listen(config.listenPort, () => {
//started listenting on port 9003
});
