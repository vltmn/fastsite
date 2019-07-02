"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mustache_1 = __importDefault(require("mustache"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const CLOUDFORMATION_PATH = path_1.default.join(__dirname, 'cloudformation.yml.mustache');
const templateStr = fs_1.default.readFileSync(CLOUDFORMATION_PATH, 'utf8');
exports.getTemplate = (data) => {
    return mustache_1.default.render(templateStr, data);
};
//# sourceMappingURL=template.js.map