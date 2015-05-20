var fs = require('fs'),
    path = require('path'),
    mock = require('mock-fs'),
    TestNode = require('enb/lib/test/mocks/test-node'),
    FileList = require('enb/lib/file-list'),
    Tech = require('../../../techs/bemhtml'),
    bemhtmlCoreFilename = require.resolve('bem-bl-xjst/i-bem__html.bemhtml'),
    htmlFilename = path.join(__dirname, '..', '..', 'fixtures', 'bemhtml', 'index.html'),
    mochaFilename = require.resolve('mocha/mocha.js'),
    chaiFilename = require.resolve('chai/chai.js'),
    runServer = require('../../lib/run-server');

describe('bemhtml --browser', function () {
    afterEach(function () {
        mock.restore();
    });

    it('compiled files should works on client-side', function () {
        return runTest();
    });

    it('must build block with custom exportName', function () {
        var options = { exportName: 'BH' };

        return runTest(options);
    });
});

function runTest(options) {
    var exportName = (options && options.exportName) || 'BEMHTML',
        testContent = generateTest(exportName),
        bundle,
        fileList,

        scheme = {
            blocks: {
                'base.bemhtml': fs.readFileSync(bemhtmlCoreFilename, 'utf-8'),
                'bla.bemhtml': 'block bla, tag: "a"'
            },
            bundle: {},
            'index.html': fs.readFileSync(htmlFilename, 'utf-8'),
            'test.js': testContent,
            'mocha.js': fs.readFileSync(mochaFilename, 'utf-8'),
            'chai.js': fs.readFileSync(chaiFilename, 'utf-8')
        };

    mock(scheme);

    bundle = new TestNode('bundle');
    fileList = new FileList();
    fileList.loadFromDirSync('blocks');
    bundle.provideTechData('?.files', fileList);

    return bundle.runTechAndGetContent(Tech, options)
        .spread(function (bemhtml) {
            // TODO: удалить, когда пофиксится https://github.com/enb-make/enb/issues/224
            fs.writeFileSync('bundle/bundle.bemhtml.js', bemhtml);

            return runServer(3000);
        });
}

function generateTest(exportName) {
    return [
        'chai.should();',
        'it("autogenerated test", function () {',
            exportName + '.apply({ block: "bla" }).should.equal(\'<a class="bla"></a>\');',
        '})'
    ].join('\n');
}
