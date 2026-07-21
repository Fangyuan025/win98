/* addremove.js — Add/Remove Programs that actually removes programs.
   "Uninstalled" apps hide from Start/desktop until reinstalled from the CD. */
"use strict";
W98.Apps = W98.Apps || {};

/* which optional programs can be removed, and where their files live */
W98.OptionalPrograms = {
  megaamp:  { name: "MegaAmp 2.98", size: "1.4 MB", files: ["C:/Program Files/MegaAmp/megaamp.exe", "C:/Windows/Desktop/MegaAmp.lnk"] },
  netgrab:  { name: "NetGrab (beta)", size: "0.9 MB", files: ["C:/Program Files/NetGrab/netgrab.exe", "C:/Windows/Desktop/NetGrab.lnk"] },
  pal:      { name: "Pal Messenger", size: "2.1 MB", files: ["C:/Program Files/Pal Messenger/pal.exe", "C:/Windows/Desktop/Pal Messenger.lnk"] },
  vscan:    { name: "VirusScan 98", size: "3.8 MB", files: ["C:/Windows/vscan.exe"] },
  pinball:  { name: "Star Pilot Pinball", size: "2.2 MB", files: ["C:/Program Files/Games/pinball.exe", "C:/Windows/Desktop/Star Pilot Pinball.lnk"] },
  ski:      { name: "Powder Hill", size: "1.1 MB", files: ["C:/Program Files/Games/ski.exe"] },
  wallball: { name: "WallBall", size: "0.6 MB", files: ["C:/Program Files/Games/wallball.exe"] },
  worm:     { name: "Worm 98", size: "0.3 MB", files: ["C:/Program Files/Games/worm.exe"] },
  stackz:   { name: "Stackz", size: "0.4 MB", files: ["C:/Program Files/Games/stackz.exe"] },
  encarta:  { name: "Encyclopedia 98", size: "540 MB (it's the multimedia)", files: ["C:/Program Files/Encyclopedia 98/encarta.exe"] }
};
W98.isRemoved = (id) => (Store.get("removedApps", []) || []).includes(id);

W98.Apps.addremove = {
  name: "Add/Remove Programs", icon: "programs", single: true,
  launch() {
    const win = WM.create({
      title: "Add/Remove Programs Properties", icon: "programs",
      width: 400, height: 400, resizable: false, maximizable: false, center: true
    });
    win.body.style.padding = "8px";
    const tabs = Dialogs.makeTabs([{
      label: "Install/Uninstall",
      build(page) {
        page.append(el("div", { style: "line-height:1.4;margin-bottom:8px", text: "The following software can be automatically removed. To remove a program, select it and click Add/Remove." }));
        const list = el("div", { class: "listview sunken", style: "height:180px;padding:2px" });
        let sel = null;
        function paint() {
          list.innerHTML = "";
          const removed = Store.get("removedApps", []);
          Object.keys(W98.OptionalPrograms).forEach(id => {
            const p = W98.OptionalPrograms[id];
            const gone = removed.includes(id);
            const row = el("div", { class: "lv-item", style: gone ? "color:#909090" : "" },
              Icons.img(W98.Apps[id] ? W98.Apps[id].icon : "exefile", 16),
              el("span", { class: "nm", text: p.name + (gone ? "  (removed)" : "") }),
              el("span", { style: "margin-left:auto;font-size:11px;color:#606060", text: p.size }));
            row.addEventListener("mousedown", () => {
              sel = id;
              $$(".lv-item", list).forEach(r => r.classList.remove("sel"));
              row.classList.add("sel");
              btn.textContent = gone ? "Reinstall..." : "Add/Remove...";
              btn.disabled = false;
            });
            list.append(row);
          });
        }
        const btnRow = el("div", { style: "display:flex;justify-content:flex-end;margin-top:8px" });
        const btn = el("button", { class: "btn", text: "Add/Remove...", disabled: "" });
        btn.disabled = true;
        btn.addEventListener("click", () => {
          if (!sel) return;
          const removed = Store.get("removedApps", []);
          const p = W98.OptionalPrograms[sel];
          if (removed.includes(sel)) {
            // reinstall
            simulateProgress("Installing " + p.name + "...", () => {
              Store.set("removedApps", removed.filter(x => x !== sel));
              W98.reinstallProgram(sel);
              Sound.play("ding");
              paint();
              btn.disabled = true;
              WM.msgbox({ title: "Add/Remove Programs", icon: "info", text: p.name + " has been reinstalled.\nIt is back in the Start menu." });
            });
          } else {
            WM.msgbox({
              title: "Confirm Program Removal", icon: "warning",
              text: "Are you sure you want to completely remove " + p.name + " and all of its components?",
              buttons: ["Yes", "No"]
            }).then(r => {
              if (r !== "Yes") return;
              simulateProgress("Removing " + p.name + "...", () => {
                p.files.forEach(f => { if (FS.exists(f)) FS.del(f, true); });
                removed.push(sel);
                Store.set("removedApps", removed);
                // close any open window of that app
                WM.wins.filter(w => w.opts.appId === sel).forEach(w => w.close(true));
                Sound.play("recycle");
                paint();
                btn.disabled = true;
                WM.msgbox({ title: "Add/Remove Programs", icon: "info", text: p.name + " was removed successfully.\n\n(You can reinstall it from this same list — the CD is metaphorical but always in the drive.)" });
              });
            });
          }
        });
        btnRow.append(btn);
        page.append(list, btnRow);
        paint();
      }
    }, {
      label: "Windows Setup",
      build(page) {
        page.append(
          el("div", { style: "line-height:1.5", text: "To add or remove a Windows component, click the check box. A shaded box means only part of the component will be installed." }),
          el("div", { class: "listview sunken", style: "height:170px;padding:4px;margin-top:8px" },
            ...[["Accessories", "13.2 MB", true], ["Communications", "6.1 MB", true], ["Multimedia", "18.4 MB", true],
                ["Online Services", "2.0 MB", false], ["System Tools", "8.8 MB", true], ["Desktop Wallpaper (86 patterns)", "0.7 MB", false]].map(([n, s, on]) => {
              const row = el("label", { class: "checkline" }, el("input", { type: "checkbox" }), n);
              $("input", row).checked = on;
              row.append(el("span", { style: "margin-left:auto;font-size:11px;color:#606060", text: s }));
              return row;
            })),
          el("div", { style: "text-align:right;margin-top:6px;font-size:11px;color:#606060", text: "Space required: 0.0 MB   Space available: 3.7 GB" })
        );
      }
    }]);
    const btnRow = el("div", { class: "msgbox-btns", style: "justify-content:flex-end;padding:8px 2px 2px" });
    btnRow.append(el("button", { class: "btn default", text: "OK", onclick: () => win.close() }),
      el("button", { class: "btn", text: "Cancel", onclick: () => win.close() }));
    win.body.append(tabs.el, btnRow);

    function simulateProgress(label, done) {
      const dw = WM.create({
        title: "Add/Remove Programs", icon: "programs", width: 340, height: 0,
        resizable: false, minimizable: false, maximizable: false, noTaskbar: true, center: true
      });
      dw.el.style.height = "auto";
      const bar = el("div", { class: "progress", style: "margin:6px 0" }, el("div", { class: "bar", style: "width:0%" }));
      dw.body.append(el("div", { style: "padding:14px 16px 0", text: label }), el("div", { style: "padding:0 16px 12px" }, bar));
      let p = 0;
      const iv = setInterval(() => {
        p += 8 + Math.random() * 14;
        $(".bar", bar).style.width = Math.min(100, p) + "%";
        if (p >= 100) { clearInterval(iv); dw.close(true); done(); }
      }, 120);
    }
    return win;
  }
};
