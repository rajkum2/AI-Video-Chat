'use strict';

module.exports = {
    listenPort: 9003,
    sslCrt: '/SSL_CERT_PATH',
    sslKey: '/SSL_KEY_PATH',
    cors: '*',
    videoAi: {
        enabled: true,
        videoAvatar: '',
        apiKey: 'VIDEO_AVATAR_KEY',
        apiKeyStream: 'VIDEO_AVATAR_STREAM_KEY',
        serverUrl: 'https://api.heygen.com',
        systemLimit: 'You are a streaming avatar from LiveSmart Server Video, an industry-leading product that specialize in videos commnucations. Audience will try to have a conversation with you, please try answer the questions or respond their comments naturally, and concisely. - please try your best to response with short answers, and only answer the last question.'
    },
    elevenLabs: {
        enabled: false,
        apiKey: 'ELEVENLABS_KEY',
        serverUrl: 'https://api.elevenlabs.io',
        model: 'eleven_turbo_v2_5'
    },
    chatGPT: {
        /**
        ChatGPT
            1. Goto https://platform.openai.com/
            2. Create your account
            3. Generate your APIKey https://platform.openai.com/account/api-keys
        */
        enabled: true,
        apiKey: 'CHAT_GPT_KEY',
        model: 'gpt-4o',
        max_tokens: 1000,
        temperature: 0,
    }
};
