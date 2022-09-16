#! /usr/bin/env node

import {fileURLToPath} from 'url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
import dot from 'dot';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
const indexTpl = dot.template(fs.readFileSync(path.join(__dirname, '..', 'index.dot')));

const questions = [
    {
        type: 'input',
        name: 'cloud',
        message: 'Enter a NetsBlox cloud URL',
        default: 'http://localhost:7777'
    },
    {
        type: 'input',
        name: 'title',
        message: 'Enter the website title',
        default: 'NetsBlox'
    },
];
inquirer.prompt(questions)
    .then(metaInfo => {
        metaInfo.isDevMode = true;
        console.log(metaInfo);
        const outfile = path.join(__dirname, '..', 'index.html');
        fs.writeFileSync(outfile, indexTpl(metaInfo));
    });
                //metaInfo.image = {
                    //url: baseUrl + encodeURI(`/api/projects/${project.owner}/${project.name}/thumbnail`),
                    //width: 640,
                    //height: 480
                //};
                //metaInfo.title = project.name;
                //metaInfo.description = project.notes;

//console.log('hello');
