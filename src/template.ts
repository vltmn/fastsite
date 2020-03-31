import mustache from 'mustache';
import path from 'path';
import fs from 'fs';
import { safeLoad, safeDump } from 'js-yaml';
import { CLOUDFORMATION_SCHEMA } from 'cloudformation-js-yaml-schema';

const CLOUDFORMATION_PATH = path.join(__dirname, 'cloudformation.yml.mustache');

const templateStr: string = fs.readFileSync(CLOUDFORMATION_PATH, 'utf8');

export interface TemplateArgs {
    defaultIndex: boolean;
}

export const getTemplate = (data: TemplateArgs): string => {
    return mustache.render(templateStr, data);
};

const copyTemplate = (template: string): string =>
    safeDump(safeLoad(template, { schema: CLOUDFORMATION_SCHEMA }), { schema: CLOUDFORMATION_SCHEMA });
export const templatesEquals = (template1: string, template2: string): boolean => {
    return copyTemplate(template1) == copyTemplate(template2);
};
