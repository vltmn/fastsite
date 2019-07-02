import mustache from 'mustache';
import path from 'path';
import fs from 'fs';

const CLOUDFORMATION_PATH = path.join(__dirname, 'cloudformation.yml.mustache');

const templateStr: string = fs.readFileSync(CLOUDFORMATION_PATH, 'utf8');

export interface TemplateArgs {
    defaultIndex: boolean;
}

export const getTemplate = (data: TemplateArgs): string => {
    return mustache.render(templateStr, data);
};