import Cocoa
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    var stateDir: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Win98", isDirectory: true)
    }
    var stateFile: URL { stateDir.appendingPathComponent("state.json") }
    var soundsDir: URL { stateDir.appendingPathComponent("Sounds", isDirectory: true) }
    var brandingDir: URL { stateDir.appendingPathComponent("Branding", isDirectory: true) }

    /// User-supplied artwork (e.g. flag.png) → injected data URLs. The app ships
    /// only original art; anything here is provided by the user from their own files.
    private func scanBranding() -> [String: String] {
        let mimes = ["png": "image/png", "gif": "image/gif", "jpg": "image/jpeg", "jpeg": "image/jpeg"]
        let keys: [String: String] = [
            "flag": "__WIN98_FLAG__", "logo": "__WIN98_FLAG__",
            "flag-small": "__WIN98_FLAG_SMALL__", "flag16": "__WIN98_FLAG_SMALL__"
        ]
        var out: [String: String] = [:]
        guard let items = try? FileManager.default.contentsOfDirectory(
            at: brandingDir, includingPropertiesForKeys: [.fileSizeKey]) else { return out }
        for u in items {
            guard let mime = mimes[u.pathExtension.lowercased()] else { continue }
            let base = u.deletingPathExtension().lastPathComponent.lowercased()
            guard let jsKey = keys[base] else { continue }
            let size = (try? u.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
            guard size > 0 && size < 8_000_000, let data = try? Data(contentsOf: u) else { continue }
            out[jsKey] = "data:\(mime);base64," + data.base64EncodedString()
        }
        return out
    }

    /// Scan the user's Sounds folder and return {basename: dataURL} for audio files.
    private func scanCustomSounds() -> [String: String] {
        let mimes = ["wav": "audio/wav", "mp3": "audio/mpeg", "m4a": "audio/mp4",
                     "aif": "audio/aiff", "aiff": "audio/aiff", "ogg": "audio/ogg"]
        var out: [String: String] = [:]
        guard let items = try? FileManager.default.contentsOfDirectory(
            at: soundsDir, includingPropertiesForKeys: [.fileSizeKey]) else { return out }
        for u in items {
            guard let mime = mimes[u.pathExtension.lowercased()] else { continue }
            let size = (try? u.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
            guard size > 0 && size < 12_000_000 else { continue }
            guard let data = try? Data(contentsOf: u) else { continue }
            let name = u.deletingPathExtension().lastPathComponent.lowercased()
            out[name] = "data:\(mime);base64," + data.base64EncodedString()
        }
        return out
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []
        // Non-persistent store: app code is loaded fresh from the bundle each launch
        // (no stale resource cache). Real persistence goes through the state.json bridge below.
        config.websiteDataStore = WKWebsiteDataStore.nonPersistent()
        let ucc = config.userContentController
        ucc.add(self, name: "persist")
        ucc.add(self, name: "system")

        // restore persisted state (injected before any page script runs)
        if let json = try? String(contentsOf: stateFile, encoding: .utf8), !json.isEmpty {
            let script = "window.__WIN98_STATE__ = \(json);"
            ucc.addUserScript(WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }

        // user-supplied sound files (Sounds folder) — injected for the sound engine
        try? FileManager.default.createDirectory(at: soundsDir, withIntermediateDirectories: true)
        let sounds = scanCustomSounds()
        if !sounds.isEmpty,
           let data = try? JSONSerialization.data(withJSONObject: sounds),
           let json = String(data: data, encoding: .utf8) {
            ucc.addUserScript(WKUserScript(source: "window.__WIN98_SOUNDS_FILES__ = \(json);",
                                           injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }

        // user-supplied branding artwork (Branding folder → flag.png / flag-small.png)
        try? FileManager.default.createDirectory(at: brandingDir, withIntermediateDirectories: true)
        for (jsKey, dataUrl) in scanBranding() {
            ucc.addUserScript(WKUserScript(source: "window.\(jsKey) = \"\(dataUrl)\";",
                                           injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        if #available(macOS 13.3, *) { webView.isInspectable = true }

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1100, height: 800),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered, defer: false)
        window.title = "Windows 98"
        window.minSize = NSSize(width: 760, height: 560)
        window.contentView = webView
        window.center()
        window.setFrameAutosaveName("Win98MainWindow")

        let resURL = Bundle.main.resourceURL!
        let indexURL = resURL.appendingPathComponent("web/index.html")
        webView.loadFileURL(indexURL, allowingReadAccessTo: resURL.appendingPathComponent("web", isDirectory: true))

        buildMenu()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "persist":
            if let json = message.body as? String {
                try? FileManager.default.createDirectory(at: stateDir, withIntermediateDirectories: true)
                try? json.write(to: stateFile, atomically: true, encoding: .utf8)
            }
        case "system":
            if let dict = message.body as? [String: Any], let cmd = dict["cmd"] as? String {
                switch cmd {
                case "quit":
                    NSApp.terminate(nil)
                case "revealSounds":
                    try? FileManager.default.createDirectory(at: soundsDir, withIntermediateDirectories: true)
                    NSWorkspace.shared.activateFileViewerSelecting([soundsDir])
                case "rescanSounds":
                    let sounds = scanCustomSounds()
                    if let data = try? JSONSerialization.data(withJSONObject: sounds),
                       let json = String(data: data, encoding: .utf8) {
                        webView.evaluateJavaScript("W98.Sound.loadCustomFiles(\(json));", completionHandler: nil)
                    }
                case "exportFile":
                    // {cmd:"exportFile", name:"...", text:"..."} or {..., dataUrl:"data:...;base64,..."}
                    let name = (dict["name"] as? String) ?? "export.txt"
                    var payload: Data? = nil
                    if let text = dict["text"] as? String {
                        payload = text.data(using: .utf8)
                    } else if let dataUrl = dict["dataUrl"] as? String,
                              let comma = dataUrl.range(of: ";base64,") {
                        payload = Data(base64Encoded: String(dataUrl[comma.upperBound...]))
                    }
                    guard let bytes = payload else { break }
                    let panel = NSSavePanel()
                    panel.nameFieldStringValue = name
                    panel.canCreateDirectories = true
                    panel.begin { resp in
                        if resp == .OK, let url = panel.url {
                            try? bytes.write(to: url)
                        }
                    }
                case "fetchUrl":
                    // {cmd:"fetchUrl", url, reqId, render} → IE's retro web renderer
                    guard let urlStr = dict["url"] as? String,
                          let reqId = dict["reqId"] as? String,
                          let url = URL(string: urlStr) else { break }
                    if (dict["render"] as? Bool) == true {
                        renderWeb(url, reqId: reqId)
                    } else {
                        fetchWeb(url, reqId: reqId)
                    }
                default: break
                }
            }
        default: break
        }
    }

    static let fetchUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15"

    private lazy var webSession: URLSession = {
        let cfg = URLSessionConfiguration.ephemeral
        cfg.timeoutIntervalForRequest = 12
        cfg.httpAdditionalHeaders = [
            "User-Agent": AppDelegate.fetchUA,
            "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
            "Accept-Language": "en-US,en;q=0.8",
        ]
        return URLSession(configuration: cfg)
    }()

    private func decodeBody(_ data: Data, contentType: String) -> String {
        // honor the declared charset before falling back to UTF-8 / Latin-1
        if let r = contentType.range(of: "charset=", options: .caseInsensitive) {
            let name = contentType[r.upperBound...].prefix(while: { $0.isLetter || $0.isNumber || $0 == "-" }).lowercased()
            let encodings: [String: String.Encoding] = [
                "utf-8": .utf8, "iso-8859-1": .isoLatin1, "latin-1": .isoLatin1,
                "windows-1252": .windowsCP1252, "shift_jis": .shiftJIS, "euc-jp": .japaneseEUC,
                "gbk": String.Encoding(rawValue: CFStringConvertEncodingToNSStringEncoding(CFStringEncoding(CFStringEncodings.GB_18030_2000.rawValue))),
                "gb2312": String.Encoding(rawValue: CFStringConvertEncodingToNSStringEncoding(CFStringEncoding(CFStringEncodings.GB_18030_2000.rawValue))),
                "big5": String.Encoding(rawValue: CFStringConvertEncodingToNSStringEncoding(CFStringEncoding(CFStringEncodings.big5.rawValue))),
            ]
            if let enc = encodings[String(name)], let s = String(data: data, encoding: enc) { return s }
        }
        return String(data: data, encoding: .utf8) ?? String(data: data, encoding: .isoLatin1) ?? String(decoding: data, as: UTF8.self)
    }

    private func replyFetch(_ reqId: String, _ result: [String: Any]) {
        let json = (try? JSONSerialization.data(withJSONObject: result)).flatMap { String(data: $0, encoding: .utf8) } ?? "{\"ok\":false,\"error\":\"encode failed\"}"
        DispatchQueue.main.async {
            // hand the JSON string to JS as a single safely-quoted argument
            let arg = (try? JSONSerialization.data(withJSONObject: [json])).flatMap { String(data: $0, encoding: .utf8) } ?? "[\"\"]"
            self.webView.evaluateJavaScript("W98.WebFetch.__reply(\"\(reqId)\", \(arg)[0]);", completionHandler: nil)
        }
    }

    private func fetchWeb(_ url: URL, reqId: String) {
        let task = webSession.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self else { return }
            var result: [String: Any]
            if let error = error {
                result = ["ok": false, "error": error.localizedDescription]
            } else if let http = response as? HTTPURLResponse {
                let ct = http.value(forHTTPHeaderField: "Content-Type") ?? "text/html"
                let text = data.map { self.decodeBody($0, contentType: ct) } ?? ""
                result = ["ok": true, "status": http.statusCode, "contentType": ct,
                          "finalUrl": http.url?.absoluteString ?? url.absoluteString, "body": text]
            } else {
                result = ["ok": false, "error": "no response"]
            }
            self.replyFetch(reqId, result)
        }
        task.resume()
    }

    // MARK: - full-JS rendering for sites that refuse plain fetches (Google & friends)

    private var renderers: [String: OffscreenRenderer] = [:]

    private func renderWeb(_ url: URL, reqId: String) {
        DispatchQueue.main.async {
            let r = OffscreenRenderer(url: url) { [weak self] result in
                self?.replyFetch(reqId, result)
                self?.renderers.removeValue(forKey: reqId)
            }
            self.renderers[reqId] = r
            r.start()
        }
    }
}

final class OffscreenRenderer: NSObject, WKNavigationDelegate {
    private let url: URL
    private let completion: ([String: Any]) -> Void
    private var webView: WKWebView!
    private var finished = false
    private var timeoutTimer: Timer?

    init(url: URL, completion: @escaping ([String: Any]) -> Void) {
        self.url = url
        self.completion = completion
        super.init()
        let cfg = WKWebViewConfiguration()
        cfg.suppressesIncrementalRendering = true
        webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 1024, height: 768), configuration: cfg)
        webView.customUserAgent = AppDelegate.fetchUA
        webView.navigationDelegate = self
    }

    func start() {
        timeoutTimer = Timer.scheduledTimer(withTimeInterval: 20, repeats: false) { [weak self] _ in
            self?.harvest()   // return whatever has rendered by now
        }
        webView.load(URLRequest(url: url))
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // let client-side rendering settle before harvesting the DOM
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in self?.harvest() }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { fail(error) }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { fail(error) }

    private func fail(_ error: Error) {
        guard !finished else { return }
        finished = true
        timeoutTimer?.invalidate()
        completion(["ok": false, "error": error.localizedDescription])
    }

    private func harvest() {
        guard !finished else { return }
        finished = true
        timeoutTimer?.invalidate()
        let finalUrl = webView.url?.absoluteString ?? url.absoluteString
        webView.evaluateJavaScript("document.documentElement.outerHTML") { [completion] html, _ in
            if let html = html as? String, !html.isEmpty {
                completion(["ok": true, "status": 200, "contentType": "text/html; charset=utf-8",
                            "finalUrl": finalUrl, "body": html])
            } else {
                completion(["ok": false, "error": "render produced no output"])
            }
        }
    }
}

extension AppDelegate {
    private func buildMenu() {
        let mainMenu = NSMenu()

        let appItem = NSMenuItem()
        mainMenu.addItem(appItem)
        let appMenu = NSMenu()
        appItem.submenu = appMenu
        appMenu.addItem(withTitle: "About Windows 98 (Nostalgia)", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Hide Windows 98", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Quit Windows 98", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")

        let editItem = NSMenuItem()
        mainMenu.addItem(editItem)
        let editMenu = NSMenu(title: "Edit")
        editItem.submenu = editMenu
        editMenu.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Redo", action: Selector(("redo:")), keyEquivalent: "Z")
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")

        let viewItem = NSMenuItem()
        mainMenu.addItem(viewItem)
        let viewMenu = NSMenu(title: "View")
        viewItem.submenu = viewMenu
        viewMenu.addItem(withTitle: "Enter Full Screen", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")

        let windowItem = NSMenuItem()
        mainMenu.addItem(windowItem)
        let windowMenu = NSMenu(title: "Window")
        windowItem.submenu = windowMenu
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        NSApp.windowsMenu = windowMenu

        NSApp.mainMenu = mainMenu
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
