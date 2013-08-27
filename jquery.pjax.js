(function (e) {
	function t(t, n, r) {
		r = s(n, r);
		var i = t.currentTarget;
		if (i.tagName.toUpperCase() !== "A") throw "$.fn.pjax or $.pjax.click requires an anchor element";
		if (t.which > 1 || t.metaKey || t.ctrlKey) return;
		if (location.protocol !== i.protocol || location.host !== i.host) return;
		if (i.hash && i.href.replace(i.hash, "") === location.href.replace(location.hash, "")) return;
		var o = {
			url: i.href,
			container: e(i).attr("data-pjax"),
			target: i,
			clickedElement: e(i),
			fragment: null
		};
		var u = e.extend({}, o, r);
		e.pjax(u);
		t.preventDefault()
	}

	function n() {
		return (new Date).getTime()
	}

	function r(e) {
		if (e !== null) return e.replace(/\?_pjax=[^&]+&?/, "?").replace(/_pjax=[^&]+&?/, "").replace(/[\?&]$/, "")
	}

	function i(e) {
		var t = document.createElement("a");
		t.href = e;
		return t
	}

	function s(t, n) {
		t && n ? n.container = t : e.isPlainObject(t) ? n = t : n = {
			container: t
		};
		n.container && (n.container = o(n.container));
		return n
	}

	function o(t) {
		t = e(t);
		if (!t.length) throw "no pjax container for " + t.selector;
		if (t.selector !== "" && t.context === document) return t;
		if (t.attr("id")) return e("#" + t.attr("id"));
		throw "cant get selector for pjax container!"
	}

	function u(t, n) {
		var r = e();
		t.each(function () {
			e(this).is(n) && (r = r.add(this));
			r = r.add(n, this)
		});
		return r
	}

	function a(t, n, i) {
		var s = {};
		s.url = r(n.getResponseHeader("X-PJAX-URL") || i.requestUrl);
		var o = e(t);
		if (o.length === 0) return s;
		s.title = u(o, "title").last().text();
		if (i.fragment) {
			var a = u(o, i.fragment).first();
			if (a.length) {
				s.contents = a.contents();
				s.title || (s.title = a.attr("title") || a.data("title"))
			}
		}
		else /<html/i.test(t) || (s.contents = o); if (s.contents) {
			s.contents = s.contents.not("title");
			s.contents.find("title").remove()
		}
		s.title && (s.title = e.trim(s.title));
		return s
	}

	function f() {
		this.mapping = {};
		this.forwardStack = [];
		this.backStack = []
	}
	e.fn.pjax = function (e, n) {
		return this.live("click.pjax", function (r) {
			t(r, e, n)
		})
	};
	var l = e.pjax = function (t) {
		function r(t, n) {
			var r = e.Event(t, {
				relatedTarget: s
			});
			v.trigger(r, n);
			return !r.isDefaultPrevented()
		}
		t = e.extend(!0, {}, e.ajaxSettings, l.defaults, t);
		e.isFunction(t.url) && (t.url = t.url());
		var s = t.target;
		!s && t.clickedElement && (s = t.clickedElement[0]);
		var u = i(t.url).hash,
			f = t.beforeSend,
			h = t.complete,
			p = t.success,
			d = t.error,
			v = t.context = o(t.container);
		t.data || (t.data = {});
		t.data._pjax = v.selector;
		var m;
		t.beforeSend = function (e, n) {
			if (n.timeout > 0) {
				m = setTimeout(function () {
					r("pjax:timeout", [e, t]) && e.abort("timeout")
				}, n.timeout);
				n.timeout = 0
			}
			e.setRequestHeader("X-PJAX", "true");
			e.setRequestHeader("X-PJAX-Container", v.selector);
			var s;
			if (f) {
				s = f.apply(this, arguments);
				if (s === !1) return !1
			}
			if (!r("pjax:beforeSend", [e, n])) return !1;
			t.requestUrl = i(n.url).href
		};
		t.complete = function (e, n) {
			m && clearTimeout(m);
			h && h.apply(this, arguments);
			r("pjax:complete", [e, n, t]);
			r("pjax:end", [e, t]);
			r("end.pjax", [e, t])
		};
		t.error = function (e, n, i) {
			function u(e, t) {
				window.globalError(e + ": " + t);
				window.history.pushState(null, "", window.oldPjaxURL)
			}
			var s = a("", e, t);
			d && d.apply(this, arguments);
			var o = r("pjax:error", [e, n, i, t]);
			window.ddd = [e, n, i, t, s, d, o, window.location];
			n !== "abort" && o && u(n.toUpperCase(), i.toUpperCase())
		};
		t.success = function (i, s, o) {
			var f = a(i, o, t);
			if (!f.contents) {
				window.location = f.url;
				return
			}
			l.state = {
				id: t.id || n(),
				url: f.url,
				title: f.title,
				container: v.selector,
				fragment: t.fragment,
				timeout: t.timeout
			};
			(t.push || t.replace) && window.history.replaceState(l.state, f.title, f.url);
			f.title && (document.title = f.title);
			v.html(f.contents);
			typeof t.scrollTo == "number" && e(window).scrollTop(t.scrollTo);
			(t.replace || t.push) && window._gaq && _gaq.push(["_trackPageview"]);
			u !== "" && (window.location.href = u);
			p && p.apply(this, arguments);
			r("pjax:success", [i, s, o, t])
		};
		if (!l.state) {
			l.state = {
				id: n(),
				url: window.location.href,
				title: document.title,
				container: v.selector,
				fragment: t.fragment,
				timeout: t.timeout
			};
			window.history.replaceState(l.state, document.title)
		}
		var g = l.xhr;
		if (g && g.readyState < 4) {
			g.onreadystatechange = e.noop;
			g.abort()
		}
		l.options = t;
		var g = l.xhr = e.ajax(t);
		if (g.readyState > 0) {
			e(document).trigger("pjax", [g, t]);
			if (t.push && !t.replace && g["status"] != 404) {
				c.push(l.state.id, v.clone(!0, !0).contents());
				window.oldPjaxURL = l.state.url;
				window.history.pushState(null, "", t.url)
			}
			r("pjax:start", [g, t]);
			r("start.pjax", [g, t]);
			r("pjax:send", [g, t])
		}
		return l.xhr
	};
	l.reload = function (t, n) {
		var r = {
			url: window.location.href,
			push: !1,
			replace: !0,
			scrollTo: !1
		};
		return e.pjax(e.extend(r, s(t, n)))
	};
	l.defaults = {
		timeout: 650,
		push: !0,
		replace: !1,
		type: "GET",
		dataType: "html",
		scrollTo: 0,
		maxCacheLength: 20
	};
	f.prototype.push = function (e, t) {
		this.mapping[e] = t;
		this.backStack.push(e);
		while (this.forwardStack.length) delete this.mapping[this.forwardStack.shift()];
		while (this.backStack.length > l.defaults.maxCacheLength) delete this.mapping[this.backStack.shift()]
	};
	f.prototype.get = function (e) {
		return this.mapping[e]
	};
	f.prototype.forward = function (e, t) {
		this.mapping[e] = t;
		this.backStack.push(e);
		(e = this.forwardStack.pop()) && delete this.mapping[e]
	};
	f.prototype.back = function (e, t) {
		this.mapping[e] = t;
		this.forwardStack.push(e);
		(e = this.backStack.pop()) && delete this.mapping[e]
	};
	var c = new f;
	l.click = t;
	var h = "state" in window.history,
		p = location.href;
	e(window).bind("popstate", function (t) {
		var n = !h && location.href == p;
		h = !0;
		if (n) return;
		var r = t.state;
		if (r && r.container) {
			var i = e(r.container);
			if (i.length) {
				var s = c.get(r.id);
				if (l.state) {
					var o = l.state.id < r.id ? "forward" : "back";
					c[o](l.state.id, i.clone(!0, !0).contents())
				}
				var u = e.Event("pjax:popstate", {
					state: r,
					direction: o
				});
				i.trigger(u);
				var a = {
					id: r.id,
					url: r.url,
					container: i,
					push: !1,
					fragment: r.fragment,
					timeout: r.timeout,
					scrollTo: !1g
				};
				if (s) {
					e(document).trigger("pjax", [null, a]);
					i.trigger("pjax:start", [null, a]);
					i.trigger("start.pjax", [null, a]);
					r.title && (document.title = r.title);
					i.html(s);
					l.state = r;
					i.trigger("pjax:end", [null, a]);
					i.trigger("end.pjax", [null, a])
				}
				else e.pjax(a);
				i[0].offsetHeight
			}
			else window.location = location.href
		}
	});
	e.inArray("state", e.event.props) < 0 && e.event.props.push("state");
	e.support.pjax = window.history && window.history.pushState && window.history.replaceState && !navigator.userAgent.match(/((iPod|iPhone|iPad).+\bOS\s+[1-4]|WebApps\/.+CFNetwork)/);
	if (!e.support.pjax) {
		e.pjax = function (t) {
			var n = e.isFunction(t.url) ? t.url() : t.url,
				r = t.type ? t.type.toUpperCase() : "GET",
				i = e("<form>", {
					method: r === "GET" ? "GET" : "POST",
					action: n,
					style: "display:none"
				});
			r !== "GET" && r !== "POST" && i.append(e("<input>", {
				type: "hidden",
				name: "_method",
				value: r.toLowerCase()
			}));
			var s = t.data;
			if (typeof s == "string") e.each(s.split("&"), function (t, n) {
				var r = n.split("=");
				i.append(e("<input>", {
					type: "hidden",
					name: r[0],
					value: r[1]
				}))
			});
			else if (typeof s == "object")
				for (key in s) i.append(e("<input>", {
					type: "hidden",
					name: key,
					value: s[key]
				}));
			e(document.body).append(i);
			i.submit()
		};
		e.pjax.click = e.noop;
		e.pjax.reload = window.location.reload;
		e.fn.pjax = function () {
			return this
		}
	}
})(jQuery)
