let romPatches;

let currentRomFile;
let currentRomDigest;
let currentRomData;

const CORS_PROXY_FREE = "https://api.codetabs.com/v1/proxy?quest=";
const CORS_PROXY_HAROOHIE = "https://cors.haroohie.club/";

document.addEventListener("DOMContentLoaded", function () {
    fetch("assets/json/romPatches.json")
        .then((response) => response.json())
        .then((data) => romPatches = data);
});

function getCorsProxyUrl() {
    if (window.location.host == "ermelber.github.io")
        return CORS_PROXY_HAROOHIE;
    return CORS_PROXY_FREE;
}

function loadRomData() {
    currentRomData = null;

    document.getElementById("step-2").style = "display: none;";
    document.getElementById("rom-info-content").style = "";
    document.getElementById("rom-info-image").style = "display: none;";
    document.getElementById("rom-info-digest").innerText = "SHA-256 " + currentRomDigest;

    for (var i = 0; i < romPatches.length; i++) {
        if (romPatches[i].digest == currentRomDigest) {
            document.getElementById("step-2").style = "";
            currentRomData = romPatches[i];
            loadRomInfo();
            loadRomPatches();
            return;
        }
    }

    document.getElementById("rom-info-name").innerText = "Unsupported ROM";
    alert("The supplied ROM isn't compatible")
}

function loadRomInfo() {
    var image = document.getElementById("rom-info-image");
    image.src = "assets/img/" + currentRomData.imgFile;
    image.style = "";

    document.getElementById("rom-info-name").innerText = currentRomData.name;
}

function loadRomPatches() {
    var select = document.getElementById("romPatchesSelector");

    select.innerHTML = "";

    for (var i = 0; i < currentRomData.patches.length; i++) {
        var patchInfo = currentRomData.patches[i];
        select.innerHTML += "<option value=\"" + i + "\">" + patchInfo.name + "</option>";
    }
}

function getRomFile(input) {
    currentRomFile = new MarcFile(input, () => getRomDigest().then((digest) => {
        currentRomDigest = digest;
        loadRomData();
    }));
}

function onInputRomUploaded(input) {
    getRomFile(input);
}

function getRomDigest() {
    return window.crypto.subtle.digest('SHA-256', currentRomFile._u8array.buffer)
        .then(romHash => {
            let hashBytes = new Uint8Array(romHash);
            let hexString = '';
            for (let i = 0; i < hashBytes.length; i++) {
                hexString += padZeroes(hashBytes[i], 1);
            }
            return hexString;
        })
        .catch(function () {
            alert("Failed to calculate SHA-256 of your ROM.");
            return '';
        });
}

function downloadPatch(patch) {
    let fileUri = getCorsProxyUrl() + encodeURIComponent(patch.fileUri);

    return fetch(fileUri, {
        headers: {
            "Origin": ""
        }
    })
        .then(result => result.blob())
        .then(blob => {
            var file = blob;
            file.size = blob.byteLength;
            file.type = "";
            file.name = patch.fileName;

            return file;
        }).catch(function (error) {
            console.error(error);
            alert("An error occurred fetching a patch file: " + error.message);
            return undefined;
        });
}

function patchRom() {
    if (currentRomFile == null) {
        alert("Please select a ROM.")
        return;
    }

    var selectedPatchIndex = document.getElementById("romPatchesSelector").value;
    var selectedPatch = currentRomData.patches[selectedPatchIndex];

    showLoading();

    downloadPatch(selectedPatch).then((file) => {
        if (file === undefined)
            return;

        var preparedFile = new MarcFile(file, () => {
            var patchFile = parseVCDIFF(preparedFile);
            var patchedFile = patchFile.apply(currentRomFile, false);
            patchedFile.fileName = selectedPatch.patchedRomFileName;
            patchedFile.save();

            hideLoading();
        });
    });
}

function showLoading() {
    document.getElementById("btn-wait").style = "";
    document.getElementById("btn-patch").style = "display: none;";
}

function hideLoading() {
    document.getElementById("btn-patch").style = "";
    document.getElementById("btn-wait").style = "display: none;";
}


/* FileSaver.js (source: http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js)
 * A saveAs() FileSaver implementation.
 * 1.3.8
 * 2018-03-22 14:03:47
 *
 * By Eli Grey, https://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */
var saveAs = saveAs || function (c) { "use strict"; if (!(void 0 === c || "undefined" != typeof navigator && /MSIE [1-9]\./.test(navigator.userAgent))) { var t = c.document, f = function () { return c.URL || c.webkitURL || c }, s = t.createElementNS("http://www.w3.org/1999/xhtml", "a"), d = "download" in s, u = /constructor/i.test(c.HTMLElement) || c.safari, l = /CriOS\/[\d]+/.test(navigator.userAgent), p = c.setImmediate || c.setTimeout, v = function (t) { p(function () { throw t }, 0) }, w = function (t) { setTimeout(function () { "string" == typeof t ? f().revokeObjectURL(t) : t.remove() }, 4e4) }, m = function (t) { return /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(t.type) ? new Blob([String.fromCharCode(65279), t], { type: t.type }) : t }, r = function (t, n, e) { e || (t = m(t)); var r, o = this, a = "application/octet-stream" === t.type, i = function () { !function (t, e, n) { for (var r = (e = [].concat(e)).length; r--;) { var o = t["on" + e[r]]; if ("function" == typeof o) try { o.call(t, n || t) } catch (t) { v(t) } } }(o, "writestart progress write writeend".split(" ")) }; if (o.readyState = o.INIT, d) return r = f().createObjectURL(t), void p(function () { var t, e; s.href = r, s.download = n, t = s, e = new MouseEvent("click"), t.dispatchEvent(e), i(), w(r), o.readyState = o.DONE }, 0); !function () { if ((l || a && u) && c.FileReader) { var e = new FileReader; return e.onloadend = function () { var t = l ? e.result : e.result.replace(/^data:[^;]*;/, "data:attachment/file;"); c.open(t, "_blank") || (c.location.href = t), t = void 0, o.readyState = o.DONE, i() }, e.readAsDataURL(t), o.readyState = o.INIT } r || (r = f().createObjectURL(t)), a ? c.location.href = r : c.open(r, "_blank") || (c.location.href = r); o.readyState = o.DONE, i(), w(r) }() }, e = r.prototype; return "undefined" != typeof navigator && navigator.msSaveOrOpenBlob ? function (t, e, n) { return e = e || t.name || "download", n || (t = m(t)), navigator.msSaveOrOpenBlob(t, e) } : (e.abort = function () { }, e.readyState = e.INIT = 0, e.WRITING = 1, e.DONE = 2, e.error = e.onwritestart = e.onprogress = e.onwrite = e.onabort = e.onerror = e.onwriteend = null, function (t, e, n) { return new r(t, e || t.name || "download", n) }) } }("undefined" != typeof self && self || "undefined" != typeof window && window || this);