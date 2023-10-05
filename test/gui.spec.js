/* globals expect, driver, assert */

describe("gui", function () {
  describe("parseUrlAnchors", function () {
    it('should override hash params with query params', function() {
      const qs = '?action=open&Username=qs';
      const hash = '#open:Username=hash';
      const dict = driver.ide().parseUrlAnchors(qs, hash);
      assert.equal(dict.get('Username'), 'qs');
    });

    it('should parse standard querystring (no data field)', function() {
      const qs = '?action=open&Username=qs';
      const dict = driver.ide().parseUrlAnchors(qs, '');
      assert(!dict.has('data'));
    });

    it('should parse present action from hash', function() {
      const hash = '#present:Username=hash';
      const dict = driver.ide().parseUrlAnchors('', hash);
      assert.equal(dict.get('Username'), 'hash');
    });

    it('should parse semi-structured hash data', function() {
      const hash = '#open:<project></project>';
      const dict = driver.ide().parseUrlAnchors('', hash);
      assert.equal(dict.get('data'), hash.split(':').pop());
    });

    it('should parse mixed semi-structured hash data', function() {
      const hash = '#open:<project></project>&lang=english';
      const dict = driver.ide().parseUrlAnchors('', hash);
      assert.equal(dict.get('lang'), 'english');
    });
  });

  describe("RunProjectFromUrl", function () {
    it('should drop project text on IDE', async function() {
      const params = driver.ide().getUrlSettings('', '#run:<project></project>');
      const mockIde = makeMock('droppedText', 'toggleAppMode', 'runScripts');
      await params.apply(mockIde);
      assert.equal(mockIde.callData.droppedText.length, 1);
      assert.equal(mockIde.callData.droppedText[0].pop(), '<project></project>');
    });

    it('should toggle app mode', async function() {
      const params = driver.ide().getUrlSettings('', '#run:<project></project>');
      const mockIde = makeMock('droppedText', 'toggleAppMode', 'runScripts');
      mockIde.isEmbedMode = true;
      await params.applySettings(mockIde);
      assert.equal(mockIde.callData.toggleAppMode.length, 1);
      assert.equal(mockIde.callData.toggleAppMode[0].pop(), true);
    });

    it('should run scripts', async function() {
      const params = driver.ide().getUrlSettings('', '#run:<project></project>');
      const mockIde = makeMock('droppedText', 'toggleAppMode', 'runScripts');
      mockIde.isEmbedMode = true;
      await params.applySettings(mockIde);
      assert.equal(mockIde.callData.runScripts.length, 1);
    });
  });

  describe("OpenTextFromUrl", function () {
    it('should drop project text on IDE', async function() {
      const params = driver.ide().getUrlSettings('', '#open:<blocks></blocks>');
      const mockIde = makeMock('droppedText', 'toggleAppMode', 'runScripts');
      await params.apply(mockIde);
      assert.equal(mockIde.callData.droppedText.length, 1);
      assert.equal(mockIde.callData.droppedText[0].pop(), '<blocks></blocks>');
    });
  });

  describe("OpenPublicProject", function () {
    it.skip('should set app mode by default', async function() {
      const params = driver.ide().getUrlSettings('', '#present:<blocks></blocks>');
      const mockIde = makeMock('droppedText', 'toggleAppMode', 'showMessage');
      mockIde.isEmbedMode = true;
      await params.applySettings(mockIde);
      assert.equal(mockIde.callData.toggleAppMode.length, 1);
      assert.equal(mockIde.callData.toggleAppMode[0].pop(), true);
    });

    it('should set not app mode if editMode is set', async function() {
    });

    it('should run scripts by default', async function() {
    });

    it('should not run scripts if noRun', async function() {
    });
  });

  describe("updateUrlQueryString", function () {
    function setUrl(window, url) {
      window.history.pushState("test", "test", url);
    }

    describe("public project", function () {
      it("should set public URL", function () {
        const project = {
          owner: "test",
          name: "PublicProject",
          state: "Public",
          saveState: "Saved",
        };
        driver.ide().updateUrlQueryString(project);

        const { window } = driver.globals();
        const url = window.location.href;
        assert(url.includes("ProjectName=PublicProject"));
        assert(url.includes("Username=test"));
      });

      it("should preserve hash", function () {
        const { window } = driver.globals();
        const initialHash = "#thisIsATest";
        const initialUrl = window.location.origin + window.location.pathname +
          "?" + initialHash;
        setUrl(window, initialUrl);
        const project = {
          owner: "test",
          name: "PublicProject",
          state: "Public",
          saveState: "Saved",
        };
        driver.ide().updateUrlQueryString(project);

        const url = window.location.href;
        assert(url.includes("ProjectName=PublicProject"));
        assert(url.includes("Username=test"));
        assert(url.includes(initialHash));
      });

      it("should preserve hash", function () {
        const { window } = driver.globals();
        const initialHash = "#thisIsATest";
        const initialUrl = window.location.origin + window.location.pathname +
          "?" + initialHash;
        setUrl(window, initialUrl);
        const project = {
          owner: "test",
          name: "PublicProject",
          state: "Public",
          saveState: "Saved",
        };
        driver.ide().updateUrlQueryString(project);

        const url = window.location.href;
        assert(url.includes("ProjectName=PublicProject"));
        assert(url.includes("Username=test"));
        assert(url.includes(initialHash));
      });

      it("should preserve other query params", function () {
        const { window } = driver.globals();
        const queryParam = `extensions=${encodeURIComponent('["someUrl"]')}`;
        const initialUrl = window.location.origin + window.location.pathname +
          "?" + queryParam;
        setUrl(window, initialUrl);

        const project = {
          owner: "test",
          name: "PublicProject",
          state: "Public",
          saveState: "Saved",
        };
        driver.ide().updateUrlQueryString(project);

        const url = window.location.href;
        assert(url.includes("ProjectName=PublicProject"));
        assert(url.includes("Username=test"));
        assert(url.includes(queryParam));
      });

      it("should support hash & no query string", function () {
        const { window } = driver.globals();
        const initialHash = "#thisIsATest";
        const initialUrl = window.location.origin + window.location.pathname +
          initialHash;
        setUrl(window, initialUrl);

        const project = {
          owner: "test",
          name: "PublicProject",
          state: "Public",
          saveState: "Saved",
        };
        driver.ide().updateUrlQueryString(project);

        const url = window.location.href;
        assert(url.includes("ProjectName=PublicProject"));
        assert(url.includes("Username=test"));
        assert(url.includes(initialHash));
      });

      it("should support (empty) hash", function () {
        const { window } = driver.globals();
        const initialHash = "#";
        const initialUrl = window.location.origin + window.location.pathname +
          initialHash;
        setUrl(window, initialUrl);

        const project = {
          owner: "test",
          name: "PublicProject",
          state: "Public",
          saveState: "Saved",
        };
        driver.ide().updateUrlQueryString(project);

        const url = window.location.href;
        assert(url.includes("ProjectName=PublicProject"));
        assert(url.includes("Username=test"));
      });
    });

    it("should clear project name, username if project is private", function () {
      const { window } = driver.globals();
      const initialHash = "#thisIsATest";
      const initialUrl = window.location.origin + window.location.pathname +
        "?action=present&ProjectName=PublicProject&Username=test" + initialHash;
      setUrl(window, initialUrl);

      const project = {
        owner: "test",
        name: "PrivateProject",
        state: "Private",
        saveState: "Saved",
      };
      driver.ide().updateUrlQueryString(project);

      const url = window.location.href;
      assert(!url.includes("Username=test"));
      assert(url.includes(initialHash));
    });
  });
});
