const CrtModule = require('../models/CrtModule');
const Question = require('../models/Question');
const Campus = require('../models/Campus');
const sdmsService = require('../services/sdms.service');
const aiService = require('../services/ai.service');

// Helper to slugify a string
const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Standard Level Presets
const standardLevels = [
  { level: 1, name: 'Level 1 (Beginner)', description: 'Fundamental concepts, basic formulas, and direct problems' },
  { level: 2, name: 'Level 2 (Intermediate)', description: 'Standard exam problems and moderate multi-step questions' },
  { level: 3, name: 'Level 3 (Advanced)', description: 'Complex scenarios, high-difficulty, and speed shortcuts' }
];

// Seed default dynamic CRT & Versant modules, topics, and levels
const seedDefaultCrtStructure = async () => {
  const count = await CrtModule.countDocuments();
  
  const defaultModules = [
    {
      name: 'Quantitative Aptitude',
      code: 'aptitude',
      description: 'Arithmetic, percentages, profit-loss, time & work, permutations, and probability.',
      module_type: 'mcq',
      icon: 'Calculator',
      color: 'indigo',
      order: 1,
      topics: [
        {
          name: 'Time & Work',
          code: 'time-work',
          description: 'Problems on pipes, cisterns, efficiency, and man-days.',
          levels: standardLevels,
          order: 1
        },
        {
          name: 'Percentages, Profit & Loss',
          code: 'profit-loss',
          description: 'Cost price, selling price, discounts, margins and percentages.',
          levels: standardLevels,
          order: 2
        },
        {
          name: 'Time, Speed & Distance',
          code: 'speed-distance',
          description: 'Trains, boats, streams, relative velocity and averages.',
          levels: standardLevels,
          order: 3
        },
        {
          name: 'Permutations & Combinations',
          code: 'permutations',
          description: 'Arrangements, selections, probability basics and logic.',
          levels: standardLevels,
          order: 4
        },
        {
          name: 'Number Systems & Simplification',
          code: 'number-systems',
          description: 'HCF, LCM, divisibility rules, fractions and surds.',
          levels: standardLevels,
          order: 5
        }
      ]
    },
    {
      name: 'Logical Reasoning',
      code: 'reasoning',
      description: 'Syllogisms, blood relations, series completion, coding-decoding, and direction sense.',
      module_type: 'mcq',
      icon: 'Brain',
      color: 'emerald',
      order: 2,
      topics: [
        {
          name: 'Syllogisms & Deductive Logic',
          code: 'syllogisms',
          description: 'Venn diagrams, statements, deductions and conclusions.',
          levels: standardLevels,
          order: 1
        },
        {
          name: 'Blood Relations',
          code: 'blood-relations',
          description: 'Family tree, coded relations and kinship queries.',
          levels: standardLevels,
          order: 2
        },
        {
          name: 'Direction Sense Test',
          code: 'direction-sense',
          description: 'Cardinal directions, shadows, turns and displacement.',
          levels: standardLevels,
          order: 3
        },
        {
          name: 'Coding & Decoding',
          code: 'coding-decoding',
          description: 'Letter shifts, matrix coding, and symbolic substitution.',
          levels: standardLevels,
          order: 4
        },
        {
          name: 'Series & Pattern Completion',
          code: 'series-patterns',
          description: 'Number sequences, alphabet patterns and missing terms.',
          levels: standardLevels,
          order: 5
        }
      ]
    },
    {
      name: 'Technical & CS',
      code: 'technical',
      description: 'Data structures, algorithms, DBMS/SQL, operating systems, networking, and OOP.',
      module_type: 'technical',
      icon: 'Code',
      color: 'purple',
      order: 3,
      topics: [
        {
          name: 'Data Structures & Algorithms',
          code: 'dsa',
          description: 'Arrays, linked lists, trees, graphs, sorting, and complexity.',
          levels: standardLevels,
          order: 1
        },
        {
          name: 'DBMS & SQL Queries',
          code: 'dbms-sql',
          description: 'Relational algebra, normalization, joins, indexing and transactions.',
          levels: standardLevels,
          order: 2
        },
        {
          name: 'Operating Systems',
          code: 'operating-systems',
          description: 'Processes, threads, CPU scheduling, deadlocks and memory management.',
          levels: standardLevels,
          order: 3
        },
        {
          name: 'Object-Oriented Programming (OOP)',
          code: 'oops',
          description: 'Classes, polymorphism, inheritance, encapsulation and design patterns.',
          levels: standardLevels,
          order: 4
        },
        {
          name: 'Computer Networks',
          code: 'computer-networks',
          description: 'OSI model, TCP/IP, IP addressing, HTTP, DNS and protocols.',
          levels: standardLevels,
          order: 5
        }
      ]
    },
    {
      name: 'Verbal Ability & English',
      code: 'verbal',
      description: 'Reading comprehension, sentence correction, vocabulary, idioms, and grammar.',
      module_type: 'mcq',
      icon: 'BookOpen',
      color: 'amber',
      order: 4,
      topics: [
        {
          name: 'Sentence Correction & Spotting Errors',
          code: 'grammar',
          description: 'Tenses, subject-verb agreement, modifiers and prepositions.',
          levels: standardLevels,
          order: 1
        },
        {
          name: 'Vocabulary, Synonyms & Antonyms',
          code: 'vocabulary',
          description: 'Word meanings, context clues, analogies and idiomatic usage.',
          levels: standardLevels,
          order: 2
        },
        {
          name: 'Reading Comprehension',
          code: 'reading',
          description: 'Passage comprehension, author tone, central idea and inferences.',
          levels: standardLevels,
          order: 3
        },
        {
          name: 'Para Jumbles & Fill in the Blanks',
          code: 'para-jumbles',
          description: 'Paragraph sequence reorganization and cloze tests.',
          levels: standardLevels,
          order: 4
        }
      ]
    },
    {
      name: 'Versant & Voice Assessment',
      code: 'versant',
      description: 'Speech-to-Text and Text-to-Speech communication engine: Reading aloud, sentence repetition, listening comprehension and speaking.',
      module_type: 'dual_voice',
      icon: 'Brain',
      color: 'rose',
      order: 5,
      topics: [
        {
          name: 'Part A: Reading Aloud (Audio-to-Text)',
          code: 'versant-reading',
          description: 'Candidate reads on-screen sentences aloud. AI Whisper converts speech to text and evaluates pronunciation accuracy.',
          levels: standardLevels,
          order: 1
        },
        {
          name: 'Part B: Repeat Sentence (Dual Voice AI)',
          code: 'versant-repeat',
          description: 'System plays spoken audio sentence (Text-to-Audio TTS). Candidate repeats into microphone (Audio-to-Text STT).',
          levels: standardLevels,
          order: 2
        },
        {
          name: 'Part C: Questions & Short Answers (Dual Voice AI)',
          code: 'versant-qa',
          description: 'System asks spoken questions (Text-to-Audio). Candidate gives one or two word voice answers (Audio-to-Text).',
          levels: standardLevels,
          order: 3
        },
        {
          name: 'Part D: Sentence Builds (Dual Voice AI)',
          code: 'versant-builds',
          description: 'System speaks scrambled phrases. Candidate speaks the full rearranged sentence into microphone.',
          levels: standardLevels,
          order: 4
        },
        {
          name: 'Part E: Story Retelling & Speaking (Audio-to-Text)',
          code: 'versant-story',
          description: 'Candidate speaks on a topic or retells a narrative for 30-45 seconds with fluency and vocabulary scoring.',
          levels: standardLevels,
          order: 5
        },
        {
          name: 'Part F: Listening Comprehension (Text-to-Audio)',
          code: 'versant-listening',
          description: 'Candidate listens to conversations and passages (TTS Voice) and answers comprehension questions.',
          levels: standardLevels,
          order: 6
        }
      ]
    }
  ];

  if (count === 0) {
    await CrtModule.insertMany(defaultModules);
  } else {
    // Ensure versant module is added if not yet present
    const hasVersant = await CrtModule.findOne({ code: 'versant' });
    if (!hasVersant) {
      const versantMod = defaultModules.find(m => m.code === 'versant');
      if (versantMod) {
        await CrtModule.create(versantMod);
      }
    }
  }

};


/**
 * GET /crt/modules
 * Returns all dynamic modules with topics, levels, and question counts
 */
exports.getModules = async (req, res) => {
  try {
    await seedDefaultCrtStructure();

    const modules = await CrtModule.find({ is_active: { $ne: false } })
      .sort({ order: 1, created_at: 1 })
      .lean();

    // Attach question counts per module and topic
    const counts = await Question.aggregate([
      {
        $group: {
          _id: {
            module_id: '$module_id',
            main_module_id: '$main_module_id',
            topic_id: '$topic_id',
            subcategory: '$subcategory',
            level_id: '$level_id'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const enrichedModules = modules.map(mod => {
      let moduleTotalQuestions = 0;

      const topics = (mod.topics || []).filter(t => t.is_active !== false).map(topic => {
        let topicTotalQuestions = 0;
        const topicIdStr = String(topic._id);
        const topicCodeStr = topic.code;

        const levelCounts = {};
        (topic.levels || []).forEach(lvl => {
          levelCounts[lvl.level] = 0;
        });

        counts.forEach(c => {
          const matchModule =
            String(c._id.main_module_id) === String(mod._id) ||
            c._id.module_id === mod.code ||
            c._id.module_id === String(mod._id);

          const matchTopic =
            c._id.topic_id === topicIdStr ||
            c._id.subcategory === topicCodeStr ||
            c._id.subcategory === topic.name;

          if (matchModule && matchTopic) {
            topicTotalQuestions += c.count;
            if (c._id.level_id !== undefined && levelCounts[c._id.level_id] !== undefined) {
              levelCounts[c._id.level_id] += c.count;
            }
          }
        });

        moduleTotalQuestions += topicTotalQuestions;

        const enrichedLevels = (topic.levels || []).map(lvl => ({
          ...lvl,
          question_count: levelCounts[lvl.level] || 0
        }));

        return {
          ...topic,
          levels: enrichedLevels,
          question_count: topicTotalQuestions
        };
      });

      return {
        ...mod,
        topics,
        question_count: moduleTotalQuestions
      };
    });

    return res.json({
      success: true,
      data: enrichedModules
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /crt/modules
 * Create a new Main Module
 */
exports.createModule = async (req, res) => {
  try {
    const { name, code, description, module_type, icon, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Module name is required' });
    }

    const generatedCode = (code && code.trim()) ? slugify(code) : slugify(name);

    // Check if code already exists
    const existing = await CrtModule.findOne({ code: generatedCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A module with code '${generatedCode}' already exists. Please choose a different name or code.`
      });
    }

    const maxOrder = await CrtModule.find().sort({ order: -1 }).limit(1);
    const nextOrder = (maxOrder.length && maxOrder[0].order) ? maxOrder[0].order + 1 : 1;

    const newModule = new CrtModule({
      name: name.trim(),
      code: generatedCode,
      description: description ? description.trim() : '',
      module_type: module_type || 'mcq',
      icon: icon || 'BookOpen',
      color: color || 'indigo',
      topics: [],
      order: nextOrder,
      is_active: true
    });

    await newModule.save();

    return res.status(201).json({
      success: true,
      message: 'Main module created successfully',
      data: newModule
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /crt/modules/:id
 * Edit an existing Main Module
 */
exports.updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, module_type, icon, color, is_active } = req.body;

    const mod = await CrtModule.findById(id);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    if (name && name.trim()) mod.name = name.trim();
    if (description !== undefined) mod.description = description.trim();
    if (module_type) mod.module_type = module_type;
    if (icon) mod.icon = icon;
    if (color) mod.color = color;
    if (is_active !== undefined) mod.is_active = Boolean(is_active);
    mod.updated_at = new Date();

    await mod.save();

    return res.json({
      success: true,
      message: 'Module updated successfully',
      data: mod
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /crt/modules/:id
 * Delete a Main Module
 */
exports.deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    const mod = await CrtModule.findById(id);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    await CrtModule.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Module '${mod.name}' deleted successfully`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /crt/modules/:moduleId/topics
 * Create a new Topic inside a Main Module with required Level selections
 */
exports.createTopic = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { name, code, description, levels } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Topic name is required' });
    }

    if (!levels || !Array.isArray(levels) || levels.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Level selection is required! Please select at least one level for this topic.'
      });
    }

    const mod = await CrtModule.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Main module not found' });
    }

    const generatedCode = (code && code.trim()) ? slugify(code) : slugify(name);

    const formattedLevels = levels.map((lvl, idx) => {
      if (typeof lvl === 'number') {
        return {
          level: lvl,
          name: `Level ${lvl}`,
          description: `Difficulty level ${lvl}`
        };
      }
      return {
        level: parseInt(lvl.level || idx + 1, 10),
        name: (lvl.name && lvl.name.trim()) ? lvl.name.trim() : `Level ${lvl.level || idx + 1}`,
        description: (lvl.description || '').trim()
      };
    });

    const newTopic = {
      name: name.trim(),
      code: generatedCode,
      description: (description || '').trim(),
      levels: formattedLevels,
      is_active: true,
      order: (mod.topics ? mod.topics.length : 0) + 1,
      created_at: new Date(),
      updated_at: new Date()
    };

    mod.topics.push(newTopic);
    await mod.save();

    const createdTopic = mod.topics[mod.topics.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Topic created successfully with selected levels',
      data: createdTopic
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /crt/modules/:moduleId/topics/:topicId
 * Edit an existing Topic, including dynamic level modifications
 */
exports.updateTopic = async (req, res) => {
  try {
    const { moduleId, topicId } = req.params;
    const { name, description, levels, is_active } = req.body;

    const mod = await CrtModule.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Main module not found' });
    }

    const topic = mod.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    if (name && name.trim()) topic.name = name.trim();
    if (description !== undefined) topic.description = description.trim();
    if (is_active !== undefined) topic.is_active = Boolean(is_active);

    if (levels !== undefined) {
      if (!Array.isArray(levels) || levels.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one level must be selected for the topic'
        });
      }

      topic.levels = levels.map((lvl, idx) => {
        if (typeof lvl === 'number') {
          return {
            level: lvl,
            name: `Level ${lvl}`,
            description: `Difficulty level ${lvl}`
          };
        }
        return {
          level: parseInt(lvl.level || idx + 1, 10),
          name: (lvl.name && lvl.name.trim()) ? lvl.name.trim() : `Level ${lvl.level || idx + 1}`,
          description: (lvl.description || '').trim()
        };
      });
    }

    topic.updated_at = new Date();
    await mod.save();

    return res.json({
      success: true,
      message: 'Topic and level configuration updated successfully',
      data: topic
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /crt/modules/:moduleId/topics/:topicId
 * Delete a Topic from a Main Module
 */
exports.deleteTopic = async (req, res) => {
  try {
    const { moduleId, topicId } = req.params;

    const mod = await CrtModule.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Main module not found' });
    }

    const topic = mod.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const topicName = topic.name;
    mod.topics.pull(topicId);
    await mod.save();

    return res.json({
      success: true,
      message: `Topic '${topicName}' removed successfully`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /crt/colleges
 * Fetch colleges for CRT question bank scoping (from SDMS or Campus collection fallback)
 */
exports.getColleges = async (req, res) => {
  try {
    let colleges = [];
    try {
      colleges = await sdmsService.getColleges();
    } catch (sdmsErr) {
      console.warn('[CRT] SDMS getColleges warning, falling back to Campus collection:', sdmsErr.message);
    }

    if (!colleges || colleges.length === 0) {
      const campuses = await Campus.find({ status: 'active' }).sort({ name: 1 }).lean();
      colleges = campuses.map((c, idx) => ({
        id: idx + 1,
        campus_id: c._id,
        name: c.name,
        code: c.code || ''
      }));
    }

    return res.json({
      success: true,
      data: colleges || []
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /crt/questions
 * Filter questions by module, topic, level, system conversion type, and college scope
 */
exports.getQuestions = async (req, res) => {
  try {
    const {
      module_id,
      topic_id,
      level_id,
      conversion_type,
      question_type,
      college_id,
      college_ids,
      include_global = 'false',
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    if (module_id && module_id !== 'all') {
      filter.$or = [
        { module_id: module_id },
        { subcategory: module_id }
      ];
      if (/^[0-9a-fA-F]{24}$/.test(module_id)) {
        filter.$or.push({ main_module_id: module_id });
      }
    }

    if (topic_id && topic_id !== 'all') {
      const topicFilter = [
        { topic_id: topic_id },
        { subcategory: topic_id }
      ];
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: topicFilter }
        ];
        delete filter.$or;
      } else {
        filter.$or = topicFilter;
      }
    }

    if (level_id && level_id !== 'all') {
      filter.level_id = parseInt(level_id, 10);
    }

    if (conversion_type && conversion_type !== 'all') {
      filter.conversion_type = conversion_type;
    }

    if (question_type && question_type !== 'all') {
      filter.question_type = question_type;
    }

    // College Scope Filtering (Multi-select or single)
    const rawColParam = college_ids || college_id;
    if (rawColParam && rawColParam !== 'all') {
      let collegeCondition;
      if (rawColParam === 'global') {
        collegeCondition = {
          $or: [
            { is_global: true },
            { college_id: null },
            { college_ids: { $size: 0 } }
          ]
        };
      } else {
        const parsedIds = (Array.isArray(rawColParam) ? rawColParam : String(rawColParam).split(','))
          .map(v => Number(String(v).trim()))
          .filter(n => !isNaN(n) && n > 0);

        if (parsedIds.length > 0) {
          if (include_global === 'true') {
            collegeCondition = {
              $or: [
                { college_id: { $in: parsedIds } },
                { college_ids: { $in: parsedIds } },
                { is_global: true },
                { college_id: null }
              ]
            };
          } else {
            collegeCondition = {
              $or: [
                { college_id: { $in: parsedIds } },
                { college_ids: { $in: parsedIds } }
              ]
            };
          }
        }
      }

      if (collegeCondition) {
        if (filter.$and) {
          filter.$and.push(collegeCondition);
        } else if (filter.$or) {
          filter.$and = [
            { $or: filter.$or },
            collegeCondition
          ];
          delete filter.$or;
        } else {
          Object.assign(filter, collegeCondition);
        }
      }
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      const searchCondition = {
        $or: [
          { text: searchRegex },
          { options: searchRegex },
          { explanation: searchRegex },
          { reference_text: searchRegex },
          { audio_script: searchRegex }
        ]
      };
      if (filter.$and) {
        filter.$and.push(searchCondition);
      } else if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          searchCondition
        ];
        delete filter.$or;
      } else {
        Object.assign(filter, searchCondition);
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Question.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: {
        questions,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /crt/questions
 * Create a single question with System Conversion Type (Text to Audio / Audio to Text / Both)
 */
exports.createQuestion = async (req, res) => {
  try {
    const {
      text,
      module_id,
      main_module_id,
      topic_id,
      subcategory,
      level_id,
      level_name,
      college_id,
      college_name,
      college_ids,
      campus_id,
      is_global,
      question_type = 'mcq',
      conversion_type,
      options,
      correct_answer,
      reference_text,
      audio_script,
      audio_url,
      time_limit_seconds,
      code_stub,
      expected_output,
      explanation
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Question text or prompt is required' });
    }

    // Auto-resolve conversion type
    let resolvedConversion = conversion_type;
    if (!resolvedConversion || resolvedConversion === 'none') {
      if (question_type === 'text_to_audio' || question_type === 'listening') {
        resolvedConversion = 'text_to_audio';
      } else if (question_type === 'audio_to_text' || question_type === 'speaking') {
        resolvedConversion = 'audio_to_text';
      } else if (question_type === 'audio_interactive' || question_type === 'both') {
        resolvedConversion = 'both';
      } else {
        resolvedConversion = 'none';
      }
    }

    const cleanOptions = Array.isArray(options)
      ? options.map(o => String(o).trim()).filter(Boolean)
      : [];

    // For standard MCQ, require at least 2 options
    if (resolvedConversion === 'none' && question_type === 'mcq' && cleanOptions.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 options are required for Multiple Choice questions' });
    }

    const refText = reference_text ? String(reference_text).trim() : (resolvedConversion === 'audio_to_text' || resolvedConversion === 'both' ? text.trim() : '');
    const script = audio_script ? String(audio_script).trim() : (resolvedConversion === 'text_to_audio' || resolvedConversion === 'both' ? text.trim() : '');
    const answer = correct_answer !== undefined ? String(correct_answer).trim() : (cleanOptions[0] || refText || '');

    // Resolve College Scope
    let resolvedCollegeId = null;
    let resolvedCollegeIds = [];
    let resolvedCollegeName = '';
    let resolvedIsGlobal = true;

    if (college_id !== undefined && college_id !== null && college_id !== '' && college_id !== 'all' && college_id !== 'global') {
      resolvedCollegeId = Number(college_id);
      resolvedCollegeIds = Array.isArray(college_ids) && college_ids.length ? college_ids.map(Number) : [resolvedCollegeId];
      resolvedCollegeName = college_name ? String(college_name).trim() : '';
      resolvedIsGlobal = is_global !== undefined ? Boolean(is_global === true || is_global === 'true') : false;
    } else if (Array.isArray(college_ids) && college_ids.length > 0) {
      resolvedCollegeIds = college_ids.map(Number);
      resolvedCollegeId = resolvedCollegeIds[0];
      resolvedCollegeName = college_name ? String(college_name).trim() : '';
      resolvedIsGlobal = is_global !== undefined ? Boolean(is_global === true || is_global === 'true') : false;
    } else {
      resolvedCollegeId = null;
      resolvedCollegeIds = [];
      resolvedCollegeName = 'All Colleges';
      resolvedIsGlobal = true;
    }

    const question = new Question({
      text: text.trim(),
      module_id: module_id || 'crt',
      main_module_id: main_module_id || null,
      topic_id: topic_id || '',
      subcategory: subcategory || topic_id || 'general',
      level_id: level_id ? parseInt(level_id, 10) : 1,
      level_name: level_name || `Level ${level_id || 1}`,
      college_id: resolvedCollegeId,
      college_ids: resolvedCollegeIds,
      college_name: resolvedCollegeName,
      campus_id: campus_id || null,
      is_global: resolvedIsGlobal,
      question_type: question_type,
      conversion_type: resolvedConversion,
      options: cleanOptions,
      correct_answer: answer,
      reference_text: refText,
      audio_script: script,
      audio_url: audio_url || '',
      time_limit_seconds: time_limit_seconds ? parseInt(time_limit_seconds, 10) : 45,
      code_stub: code_stub || '',
      expected_output: expected_output || '',
      explanation: explanation ? explanation.trim() : ''
    });

    await question.save();

    return res.status(201).json({
      success: true,
      message: 'Question added successfully with conversion type',
      data: question
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /crt/questions/bulk
 * Bulk upload questions parsed from CSV / Excel supporting System Types
 */
exports.bulkUploadQuestions = async (req, res) => {
  try {
    const {
      module_id,
      main_module_id,
      topic_id,
      subcategory,
      level_id,
      level_name,
      college_id,
      college_name,
      college_ids,
      campus_id,
      is_global,
      questions
    } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions array is required' });
    }

    const docsToInsert = [];

    questions.forEach((q) => {
      const qText = q.text || q.question;
      if (!qText || !String(qText).trim()) return;

      const opts = Array.isArray(q.options)
        ? q.options.map(o => String(o).trim()).filter(Boolean)
        : [q.option_a, q.option_b, q.option_c, q.option_d].map(o => (o !== undefined && o !== null) ? String(o).trim() : '').filter(Boolean);

      const qType = q.question_type || q.type || 'mcq';
      let convType = q.conversion_type;
      if (!convType || convType === 'none') {
        if (qType === 'text_to_audio' || q.audio_script || qType === 'listening') {
          convType = 'text_to_audio';
        } else if (qType === 'audio_to_text' || q.reference_text || qType === 'speaking') {
          convType = 'audio_to_text';
        } else if (qType === 'both' || qType === 'audio_interactive') {
          convType = 'both';
        } else {
          convType = 'none';
        }
      }

      const refText = q.reference_text || (convType === 'audio_to_text' || convType === 'both' ? String(qText).trim() : '');
      const script = q.audio_script || (convType === 'text_to_audio' || convType === 'both' ? String(qText).trim() : '');
      const ans = q.correct_answer || q.answer || refText || (opts.length > 0 ? opts[0] : '');

      // Resolve College Scope per question or batch fallback
      let rowCollegeId = null;
      let rowCollegeIds = [];
      let rowCollegeName = '';
      let rowIsGlobal = true;

      const rawCandidateIds = (Array.isArray(q.college_ids) && q.college_ids.length > 0)
        ? q.college_ids
        : (Array.isArray(college_ids) && college_ids.length > 0
          ? college_ids
          : (q.college_id && q.college_id !== 'all' && q.college_id !== 'global'
            ? [q.college_id]
            : (college_id && college_id !== 'all' && college_id !== 'global' ? [college_id] : [])));

      const parsedColIds = (Array.isArray(rawCandidateIds) ? rawCandidateIds : String(rawCandidateIds).split(','))
        .map(v => Number(String(v).trim()))
        .filter(n => !isNaN(n) && n > 0);

      if (parsedColIds.length > 0) {
        rowCollegeIds = parsedColIds;
        rowCollegeId = parsedColIds[0];
        rowCollegeName = q.college_name || college_name || '';
        rowIsGlobal = q.is_global !== undefined
          ? Boolean(q.is_global === true || q.is_global === 'true')
          : (is_global !== undefined ? Boolean(is_global === true || is_global === 'true') : false);
      } else {
        rowCollegeId = null;
        rowCollegeIds = [];
        rowCollegeName = 'All Colleges';
        rowIsGlobal = true;
      }

      docsToInsert.push({
        text: String(qText).trim(),
        module_id: module_id || q.module_id || 'crt',
        main_module_id: main_module_id || q.main_module_id || null,
        topic_id: topic_id || q.topic_id || '',
        subcategory: subcategory || q.subcategory || topic_id || 'general',
        level_id: q.level_id ? parseInt(q.level_id, 10) : (level_id ? parseInt(level_id, 10) : 1),
        level_name: q.level_name || level_name || `Level ${level_id || 1}`,
        college_id: rowCollegeId,
        college_ids: rowCollegeIds,
        college_name: rowCollegeName,
        campus_id: q.campus_id || campus_id || null,
        is_global: rowIsGlobal,
        question_type: qType,
        conversion_type: convType,
        options: opts,
        correct_answer: String(ans).trim(),
        reference_text: String(refText).trim(),
        audio_script: String(script).trim(),
        audio_url: q.audio_url || '',
        time_limit_seconds: q.time_limit_seconds ? parseInt(q.time_limit_seconds, 10) : 45,
        code_stub: q.code_stub || '',
        expected_output: q.expected_output || '',
        explanation: q.explanation ? String(q.explanation).trim() : ''
      });
    });

    if (docsToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found in payload'
      });
    }

    const inserted = await Question.insertMany(docsToInsert);

    return res.status(201).json({
      success: true,
      message: `Successfully uploaded ${inserted.length} questions into the CRT question bank!`,
      count: inserted.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /crt/questions/:id
 * Edit an existing question including System Conversion fields
 */
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      text,
      options,
      correct_answer,
      reference_text,
      audio_script,
      audio_url,
      time_limit_seconds,
      explanation,
      level_id,
      level_name,
      question_type,
      conversion_type,
      topic_id,
      subcategory,
      code_stub,
      expected_output,
      college_id,
      college_name,
      college_ids,
      campus_id,
      is_global
    } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (text && text.trim()) question.text = text.trim();
    if (Array.isArray(options)) {
      question.options = options.map(o => String(o).trim()).filter(Boolean);
    }
    if (correct_answer !== undefined) question.correct_answer = String(correct_answer).trim();
    if (reference_text !== undefined) question.reference_text = String(reference_text).trim();
    if (audio_script !== undefined) question.audio_script = String(audio_script).trim();
    if (audio_url !== undefined) question.audio_url = audio_url;
    if (time_limit_seconds !== undefined) question.time_limit_seconds = parseInt(time_limit_seconds, 10);
    if (explanation !== undefined) question.explanation = String(explanation).trim();
    if (level_id !== undefined) question.level_id = parseInt(level_id, 10);
    if (level_name) question.level_name = level_name;
    if (question_type) question.question_type = question_type;
    if (conversion_type) question.conversion_type = conversion_type;
    if (topic_id) question.topic_id = topic_id;
    if (subcategory) question.subcategory = subcategory;
    if (code_stub !== undefined) question.code_stub = code_stub;
    if (expected_output !== undefined) question.expected_output = expected_output;

    if (college_id !== undefined) {
      if (college_id === null || college_id === '' || college_id === 'all' || college_id === 'global') {
        question.college_id = null;
        question.college_name = 'All Colleges';
        question.college_ids = [];
        question.is_global = true;
      } else {
        question.college_id = Number(college_id);
        question.college_name = college_name !== undefined ? String(college_name).trim() : question.college_name;
        question.college_ids = Array.isArray(college_ids) && college_ids.length ? college_ids.map(Number) : [Number(college_id)];
        question.is_global = is_global !== undefined ? Boolean(is_global === true || is_global === 'true') : false;
      }
    } else if (is_global !== undefined) {
      question.is_global = Boolean(is_global === true || is_global === 'true');
    }
    if (campus_id !== undefined) question.campus_id = campus_id || null;

    question.updated_at = new Date();

    await question.save();

    return res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /crt/questions/:id
 * Delete a question
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Question.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    return res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /crt/tts-preview
 * Generate instant TTS voice speech preview for Text-to-Audio prompts
 */
exports.generateTTSPreview = async (req, res) => {
  try {
    const { text, language = 'en', accent = 'com' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required for TTS conversion' });
    }
    const ttsResult = await aiService.generateTTS(text.trim(), language, accent, 'base64');
    return res.json(ttsResult);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /crt/stats
 * Overview counts for CRT & Versant portal
 */
exports.getStats = async (req, res) => {
  try {
    const [modulesCount, questionsCount] = await Promise.all([
      CrtModule.countDocuments({ is_active: { $ne: false } }),
      Question.countDocuments()
    ]);

    const modules = await CrtModule.find({ is_active: { $ne: false } }).select('topics');
    let totalTopics = 0;
    modules.forEach(m => {
      totalTopics += (m.topics || []).filter(t => t.is_active !== false).length;
    });

    const [audioToTextCount, textToAudioCount, bothCount, collegeScopedCount, globalCount] = await Promise.all([
      Question.countDocuments({ conversion_type: 'audio_to_text' }),
      Question.countDocuments({ conversion_type: 'text_to_audio' }),
      Question.countDocuments({ conversion_type: 'both' }),
      Question.countDocuments({ is_global: false, college_id: { $ne: null } }),
      Question.countDocuments({ $or: [{ is_global: true }, { college_id: null }] })
    ]);

    return res.json({
      success: true,
      data: {
        totalModules: modulesCount,
        totalTopics: totalTopics,
        totalQuestions: questionsCount,
        audioToTextQuestions: audioToTextCount,
        textToAudioQuestions: textToAudioCount,
        dualVoiceQuestions: bothCount,
        collegeScopedQuestions: collegeScopedCount,
        globalQuestions: globalCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
