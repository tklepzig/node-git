var fs = require('fs');

try {
    fs.mkdirSync('doc-repo');
} catch (ex) {
    if (ex.code !== 'EEXIST') { //throw all errors except 'directory exists already'
        throw ex;
    }
}

var git = require('simple-git')('doc-repo');

if (fs.readdirSync('doc-repo').length === 0) {
    git.clone('https://github.com/tklepzig/cn-doc-test.git', '.');
}

fs.writeFileSync("doc-repo/document", "1");

git.add(__dirname + '/doc-repo/document')
    .then(function() {
        console.log('add fertsch');
    })
    .commit('added document file')
    .then(function() {
        console.log('commit fertsch');
    })
    .push('origin', 'master')
    .then(function() {
        console.log('push fertsch');
    });
