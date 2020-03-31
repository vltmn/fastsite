"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mustache_1 = __importDefault(require("mustache"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = require("js-yaml");
const cloudformation_js_yaml_schema_1 = require("cloudformation-js-yaml-schema");
const CLOUDFORMATION_PATH = path_1.default.join(__dirname, 'cloudformation.yml.mustache');
const templateStr = fs_1.default.readFileSync(CLOUDFORMATION_PATH, 'utf8');
exports.getTemplate = (data) => {
    return mustache_1.default.render(templateStr, data);
};
const copyTemplate = (template) => js_yaml_1.safeDump(js_yaml_1.safeLoad(template, { schema: cloudformation_js_yaml_schema_1.CLOUDFORMATION_SCHEMA }), { schema: cloudformation_js_yaml_schema_1.CLOUDFORMATION_SCHEMA });
exports.templatesEquals = (template1, template2) => {
    return copyTemplate(template1) == copyTemplate(template2);
};
//# sourceMappingURL=template.js.map