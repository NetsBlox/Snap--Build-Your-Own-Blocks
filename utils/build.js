#! /usr/bin/env node

const dot = require('dot');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
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
