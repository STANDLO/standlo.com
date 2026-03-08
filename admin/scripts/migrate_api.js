/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}
walk('./app').forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let newContent = content.replace(/\"\/api\//g, '\"/admin/api/').replace(/\`\/api\//g, '\`/admin/api/').replace(/\$\{baseUrl\}\/api\//g, '${baseUrl}/admin/api/');
    if (content !== newContent) {
        fs.writeFileSync(f, newContent);
        console.log('Updated', f);
    }
});
