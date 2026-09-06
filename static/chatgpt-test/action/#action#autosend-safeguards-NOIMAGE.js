(() => {
    // ============================================================
    // CONFIG
    // ============================================================

    const MESSAGE = 'Hello, this is a test!';

    const EDITOR_SELECTOR =
        '#prompt-textarea[contenteditable="true"]';

    const SEND_DELAY = 50;


    // ============================================================
    // GET EDITOR
    // ============================================================

    const editor = document.querySelector(EDITOR_SELECTOR);

    if (!editor) {
        console.error('[BLOCKER] Editor not found.');
        return;
    }


    // ============================================================
    // NORMALIZE TEXT
    // ============================================================

    function normalize(text) {
        return String(text || '')
            .normalize('NFKC')
            .toLowerCase()

            // Common visual substitutions / obfuscation
            .replace(/0/g, 'o')
            .replace(/1/g, 'i')
            .replace(/3/g, 'e')
            .replace(/4/g, 'a')
            .replace(/5/g, 's')
            .replace(/7/g, 't')

            // Convert punctuation/separators to spaces
            .replace(/[_\-./\\|:,;!?'"`(){}\[\]<>+=*~`@#$%^&]/g, ' ')

            // Remove repeated whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }


    // ============================================================
    // WORD HELPERS
    // ============================================================

    function hasWord(text, words) {
        return words.some(word =>
            new RegExp(`\\b${word}\\b`, 'i').test(text)
        );
    }

    function hasAny(text, patterns) {
        return patterns.some(pattern => pattern.test(text));
    }


    // ============================================================
    // IMAGE / VISUAL OUTPUT TERMS
    // ============================================================

    const VISUAL_TERMS = [
        'image',
        'images',
        'img',
        'photo',
        'photos',
        'photograph',
        'photographs',
        'picture',
        'pictures',
        'pic',
        'pics',
        'portrait',
        'illustration',
        'illustrations',
        'drawing',
        'drawings',
        'artwork',
        'art',
        'render',
        'rendering',
        'renders',
        'graphic',
        'graphics',
        'visual',
        'visuals',
        'scene',
        'wallpaper',
        'poster',
        'thumbnail',
        'icon',
        'avatar',
        'selfie',
        'logo',
        'diagram',
        'sketch',
        'painting',
        'painting',
        'cartoon',
        'comic',
        'meme',
        'collage',
        'photorealistic',
        'photorealism',
        '3d',
        'cgi'
    ];


    // Common misspellings / alternate spellings
    const VISUAL_MISSPELLINGS = [
        /\bfoto\b/,
        /\bfotos\b/,
        /\bfotograph\b/,
        /\bfotography\b/,
        /\bimge\b/,
        /\bimag\b/,
        /\bpik\b/,
        /\bpikchar\b/,
        /\bpikture\b/,
        /\bpicure\b/,
        /\bpotrait\b/,
        /\billustartion\b/
    ];


    // ============================================================
    // GENERATION / CREATION ACTIONS
    // ============================================================

    const GENERATION_TERMS = [
        'create',
        'creates',
        'created',
        'creating',
        'generate',
        'generates',
        'generated',
        'generating',
        'make',
        'makes',
        'made',
        'making',
        'produce',
        'produces',
        'produced',
        'producing',
        'draw',
        'draws',
        'drew',
        'drawing',
        'render',
        'renders',
        'rendered',
        'rendering',
        'design',
        'designs',
        'designed',
        'designing',
        'illustrate',
        'illustrates',
        'illustrated',
        'illustrating',
        'depict',
        'depicts',
        'depicted',
        'depicting',
        'show',
        'shows',
        'showing',
        'visualize',
        'visualise',
        'visualize',
        'visualise',
        'paint',
        'painting',
        'sketch',
        'sketching'
    ];


    // ============================================================
    // DIRECT IMAGE-REQUEST PHRASES
    // ============================================================

    const DIRECT_IMAGE_PATTERNS = [

        // create/generate/make + visual
        /\b(create|generate|make|produce|render|draw|design)\b.{0,80}\b(image|images|photo|photos|picture|pictures|pic|pics|portrait|illustration|drawing|artwork|visual|render|wallpaper|poster|logo|avatar|selfie|diagram|sketch|painting|cartoon|comic|meme|graphic|graphics)\b/i,

        // visual + create/generate/make
        /\b(image|images|photo|photos|picture|pictures|pic|pics|portrait|illustration|drawing|artwork|visual|wallpaper|poster|logo|avatar|selfie|diagram|sketch|painting|cartoon|comic|meme|graphic|graphics)\b.{0,80}\b(create|generate|make|produce|render|draw|design)\b/i,

        // "please generate..."
        /\bplease\b.{0,40}\b(generate|create|make|produce|draw|render|design)\b/i,

        // "can you make/create/generate..."
        /\b(can|could|would)\s+you\b.{0,50}\b(create|generate|make|produce|draw|render|design)\b/i,

        // imperative visual requests
        /\b(show|give|send)\s+(me\s+)?(an?\s+)?(image|photo|picture|pic|portrait|illustration|drawing|visual)\b/i,

        // "I want an image..."
        /\b(i|id|i'd|i would|i want|we want)\b.{0,50}\b(an?\s+)?(image|photo|picture|portrait|illustration|drawing|visual)\b/i,

        // "turn this into an image"
        /\b(turn|transform|convert|change)\b.{0,100}\b(into|to)\b.{0,30}\b(image|photo|picture|illustration|art|drawing|visual)\b/i,

        // "image of..."
        /\b(image|photo|picture|portrait|illustration|drawing|render|visual)\s+of\b/i,

        // "photo of..."
        /\b(photo|picture|image|portrait)\s+of\b/i
    ];


    // ============================================================
    // CONTEXTUAL GENERATION DETECTION
    // ============================================================

    function detectImageGeneration(text) {
        const t = normalize(text);

        if (!t) {
            return false;
        }

        // --------------------------------------------------------
        // 1. Explicit image-generation patterns
        // --------------------------------------------------------

        if (DIRECT_IMAGE_PATTERNS.some(pattern => pattern.test(t))) {
            return true;
        }


        // --------------------------------------------------------
        // 2. Generation verb + visual term
        // --------------------------------------------------------

        const hasGeneration =
            hasWord(t, GENERATION_TERMS);

        const hasVisual =
            hasWord(t, VISUAL_TERMS) ||
            VISUAL_MISSPELLINGS.some(pattern => pattern.test(t));

        if (hasGeneration && hasVisual) {
            return true;
        }


        // --------------------------------------------------------
        // 3. Strong standalone image-generation language
        // --------------------------------------------------------

        const strongPatterns = [

            /\btext\s+to\s+image\b/i,
            /\btext\s+to\s+photo\b/i,
            /\btext\s+to\s+picture\b/i,

            /\bai\s+image\b/i,
            /\bai\s+photo\b/i,
            /\bai\s+picture\b/i,

            /\bimage\s+generator\b/i,
            /\bphoto\s+generator\b/i,
            /\bpicture\s+generator\b/i,
            /\bimage\s+generation\b/i,
            /\bphoto\s+generation\b/i,

            /\bgenerate\s+art\b/i,
            /\bcreate\s+art\b/i,
            /\bmake\s+art\b/i,

            /\bgenerate\s+a\s+scene\b/i,
            /\bcreate\s+a\s+scene\b/i,
            /\bmake\s+a\s+scene\b/i,

            /\bgenerate\s+a\s+portrait\b/i,
            /\bcreate\s+a\s+portrait\b/i,
            /\bmake\s+a\s+portrait\b/i,

            /\bgenerate\s+a\s+render\b/i,
            /\bcreate\s+a\s+render\b/i,
            /\bmake\s+a\s+render\b/i
        ];

        if (strongPatterns.some(pattern => pattern.test(t))) {
            return true;
        }


        // --------------------------------------------------------
        // 4. Image-generation vocabulary combinations
        // --------------------------------------------------------

        const subjectPatterns = [

            /\bof\s+(a|an|the)\s+\w+/i,
            /\bof\s+\w+/i,
            /\bwith\s+\w+/i,
            /\bfeaturing\s+\w+/i,
            /\bshowing\s+\w+/i,
            /\bdepicting\s+\w+/i,
            /\bcontaining\s+\w+/i
        ];

        const hasSubject =
            subjectPatterns.some(pattern => pattern.test(t));

        if (hasVisual && hasGeneration && hasSubject) {
            return true;
        }


        // --------------------------------------------------------
        // 5. Image-specific prompting language
        // --------------------------------------------------------

        const promptLanguage = [

            /\bprompt\s+for\s+(an?\s+)?image\b/i,
            /\bprompt\s+for\s+(an?\s+)?photo\b/i,
            /\bprompt\s+to\s+generate\b/i,

            /\bimage\s+prompt\b/i,
            /\bphoto\s+prompt\b/i,
            /\bpicture\s+prompt\b/i,

            /\bnegative\s+prompt\b/i,
            /\bpositive\s+prompt\b/i,

            /\bphotorealistic\b/i,
            /\bphotorealism\b/i,
            /\bhyperrealistic\b/i,
            /\bhyperrealism\b/i,

            /\b8k\b.{0,50}\b(image|photo|render|picture)\b/i,
            /\b4k\b.{0,50}\b(image|photo|render|picture)\b/i,

            /\bwide\s+angle\b.{0,80}\b(image|photo|scene)\b/i,
            /\bclose\s+up\b.{0,80}\b(photo|image|portrait)\b/i,

            /\bcinematic\b.{0,80}\b(image|photo|scene|shot)\b/i
        ];

        if (promptLanguage.some(pattern => pattern.test(t))) {
            return true;
        }


        return false;
    }


    // ============================================================
    // BLOCK
    // ============================================================

    if (detectImageGeneration(MESSAGE)) {
        console.warn(
            '[IMAGE BLOCKER] Message blocked because it appears to request visual/image content generation:',
            MESSAGE
        );

        return;
    }


    // ============================================================
    // TYPE MESSAGE
    // ============================================================

    editor.focus();

    document.execCommand(
        'insertText',
        false,
        MESSAGE
    );

    editor.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: MESSAGE
    }));


    // ============================================================
    // AUTO SEND
    // ============================================================

    setTimeout(() => {

        // Re-check immediately before sending.
        // This protects against MESSAGE being modified later.
        if (detectImageGeneration(editor.innerText || editor.textContent || '')) {
            console.warn(
                '[IMAGE BLOCKER] Send prevented.'
            );
            return;
        }

        editor.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        }));

    }, SEND_DELAY);

})();
