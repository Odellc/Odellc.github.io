
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Disclaimer.svelte generated by Svelte v3.18.1 */

    function create_fragment(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Disclaimer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Disclaimer",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\Navigation.svelte generated by Svelte v3.18.1 */

    const { window: window_1 } = globals;
    const file = "src\\Navigation.svelte";

    function create_fragment$1(ctx) {
    	let nav;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let a3;
    	let t7;
    	let a4;
    	let t9;
    	let a5;
    	let t11;
    	let current;
    	let dispose;
    	const disclaimer = new Disclaimer({ $$inline: true });

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "Home";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "About";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Proficiencies";
    			t5 = space();
    			a3 = element("a");
    			a3.textContent = "Projects";
    			t7 = space();
    			a4 = element("a");
    			a4.textContent = "Contact";
    			t9 = space();
    			a5 = element("a");
    			a5.textContent = "Hire Me!";
    			t11 = space();
    			create_component(disclaimer.$$.fragment);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-12shz12");
    			add_location(a0, file, 20, 2, 486);
    			attr_dev(a1, "href", "");
    			attr_dev(a1, "class", "svelte-12shz12");
    			add_location(a1, file, 21, 2, 510);
    			attr_dev(a2, "href", "");
    			attr_dev(a2, "class", "svelte-12shz12");
    			add_location(a2, file, 26, 2, 622);
    			attr_dev(a3, "href", "");
    			attr_dev(a3, "class", "svelte-12shz12");
    			add_location(a3, file, 31, 2, 750);
    			attr_dev(a4, "href", "");
    			attr_dev(a4, "class", "svelte-12shz12");
    			add_location(a4, file, 36, 2, 868);
    			attr_dev(a5, "href", "");
    			attr_dev(a5, "class", "svelte-12shz12");
    			add_location(a5, file, 41, 2, 984);
    			attr_dev(nav, "class", "svelte-12shz12");
    			add_location(nav, file, 19, 0, 477);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, a0);
    			append_dev(nav, t1);
    			append_dev(nav, a1);
    			append_dev(nav, t3);
    			append_dev(nav, a2);
    			append_dev(nav, t5);
    			append_dev(nav, a3);
    			append_dev(nav, t7);
    			append_dev(nav, a4);
    			append_dev(nav, t9);
    			append_dev(nav, a5);
    			append_dev(nav, t11);
    			mount_component(disclaimer, nav, null);
    			current = true;

    			dispose = [
    				listen_dev(window_1, "scroll", /*scroll_handler*/ ctx[1], false, false, false),
    				listen_dev(a1, "click", prevent_default(/*click_handler*/ ctx[2]), false, true, false),
    				listen_dev(a2, "click", prevent_default(/*click_handler_1*/ ctx[3]), false, true, false),
    				listen_dev(a3, "click", prevent_default(/*click_handler_2*/ ctx[4]), false, true, false),
    				listen_dev(a4, "click", prevent_default(/*click_handler_3*/ ctx[5]), false, true, false),
    				listen_dev(a5, "click", prevent_default(/*click_handler_4*/ ctx[6]), false, true, false)
    			];
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(disclaimer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(disclaimer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(disclaimer);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function changeBackground(e) {
    	let yScroll = window.scrollY;

    	if (yScroll > 0) {
    		document.querySelector("nav").style.background = "black";
    	} else if (yScroll == 0) {
    		document.querySelector("nav").style.background = null;
    	}
    }

    function instance($$self, $$props, $$invalidate) {
    	let { baseURL } = $$props;
    	const writable_props = ["baseURL"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navigation> was created with unknown prop '${key}'`);
    	});

    	const scroll_handler = e => changeBackground();
    	const click_handler = () => window.location = baseURL + "#about";
    	const click_handler_1 = () => window.location = baseURL + "#proficiencies";
    	const click_handler_2 = () => window.location = baseURL + "#projects";
    	const click_handler_3 = () => window.location = baseURL + "#contact";
    	const click_handler_4 = () => window.location = baseURL + "#contact";

    	$$self.$set = $$props => {
    		if ("baseURL" in $$props) $$invalidate(0, baseURL = $$props.baseURL);
    	};

    	$$self.$capture_state = () => {
    		return { baseURL };
    	};

    	$$self.$inject_state = $$props => {
    		if ("baseURL" in $$props) $$invalidate(0, baseURL = $$props.baseURL);
    	};

    	return [
    		baseURL,
    		scroll_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, { baseURL: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*baseURL*/ ctx[0] === undefined && !("baseURL" in props)) {
    			console.warn("<Navigation> was created without expected prop 'baseURL'");
    		}
    	}

    	get baseURL() {
    		throw new Error("<Navigation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set baseURL(value) {
    		throw new Error("<Navigation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var page = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
    	 module.exports = factory() ;
    }(commonjsGlobal, (function () {
    var isarray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
      // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
      // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
      '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {String} str
     * @return {Array}
     */
    function parse (str) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var res;

      while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          continue
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
        }

        var prefix = res[2];
        var name = res[3];
        var capture = res[4];
        var group = res[5];
        var suffix = res[6];
        var asterisk = res[7];

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';
        var delimiter = prefix || '/';
        var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

        tokens.push({
          name: name || key++,
          prefix: prefix || '',
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: escapeGroup(pattern)
        });
      }

      // Match any characters still remaining.
      if (index < str.length) {
        path += str.substr(index);
      }

      // If the path exists, push it onto the end.
      if (path) {
        tokens.push(path);
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {String}   str
     * @return {Function}
     */
    function compile (str) {
      return tokensToFunction(parse(str))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^' + tokens[i].pattern + '$');
        }
      }

      return function (obj) {
        var path = '';
        var data = obj || {};

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;

            continue
          }

          var value = data[token.name];
          var segment;

          if (value == null) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to be defined')
            }
          }

          if (isarray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
            }

            if (value.length === 0) {
              if (token.optional) {
                continue
              } else {
                throw new TypeError('Expected "' + token.name + '" to not be empty')
              }
            }

            for (var j = 0; j < value.length; j++) {
              segment = encodeURIComponent(value[j]);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          segment = encodeURIComponent(value);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += token.prefix + segment;
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {String} str
     * @return {String}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys (re, keys) {
      re.keys = keys;
      return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags (options) {
      return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp (path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

      return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function stringToRegexp (path, keys, options) {
      var tokens = parse(path);
      var re = tokensToRegExp(tokens, options);

      // Attach keys back to the regexp.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys.push(tokens[i]);
        }
      }

      return attachKeys(re, keys)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {Array}  tokens
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function tokensToRegExp (tokens, options) {
      options = options || {};

      var strict = options.strict;
      var end = options.end !== false;
      var route = '';
      var lastToken = tokens[tokens.length - 1];
      var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var prefix = escapeString(token.prefix);
          var capture = token.pattern;

          if (token.repeat) {
            capture += '(?:' + prefix + capture + ')*';
          }

          if (token.optional) {
            if (prefix) {
              capture = '(?:' + prefix + '(' + capture + '))?';
            } else {
              capture = '(' + capture + ')?';
            }
          } else {
            capture = prefix + '(' + capture + ')';
          }

          route += capture;
        }
      }

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return new RegExp('^' + route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(String|RegExp|Array)} path
     * @param  {Array}                 [keys]
     * @param  {Object}                [options]
     * @return {RegExp}
     */
    function pathToRegexp (path, keys, options) {
      keys = keys || [];

      if (!isarray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (isarray(path)) {
        return arrayToRegexp(path, keys, options)
      }

      return stringToRegexp(path, keys, options)
    }

    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

    /**
       * Module dependencies.
       */

      

      /**
       * Short-cuts for global-object checks
       */

      var hasDocument = ('undefined' !== typeof document);
      var hasWindow = ('undefined' !== typeof window);
      var hasHistory = ('undefined' !== typeof history);
      var hasProcess = typeof process !== 'undefined';

      /**
       * Detect click event
       */
      var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var isLocation = hasWindow && !!(window.history.location || window.location);

      /**
       * The page instance
       * @api private
       */
      function Page() {
        // public things
        this.callbacks = [];
        this.exits = [];
        this.current = '';
        this.len = 0;

        // private things
        this._decodeURLComponents = true;
        this._base = '';
        this._strict = false;
        this._running = false;
        this._hashbang = false;

        // bound functions
        this.clickHandler = this.clickHandler.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
      }

      /**
       * Configure the instance of page. This can be called multiple times.
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.configure = function(options) {
        var opts = options || {};

        this._window = opts.window || (hasWindow && window);
        this._decodeURLComponents = opts.decodeURLComponents !== false;
        this._popstate = opts.popstate !== false && hasWindow;
        this._click = opts.click !== false && hasDocument;
        this._hashbang = !!opts.hashbang;

        var _window = this._window;
        if(this._popstate) {
          _window.addEventListener('popstate', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('popstate', this._onpopstate, false);
        }

        if (this._click) {
          _window.document.addEventListener(clickEvent, this.clickHandler, false);
        } else if(hasDocument) {
          _window.document.removeEventListener(clickEvent, this.clickHandler, false);
        }

        if(this._hashbang && hasWindow && !hasHistory) {
          _window.addEventListener('hashchange', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('hashchange', this._onpopstate, false);
        }
      };

      /**
       * Get or set basepath to `path`.
       *
       * @param {string} path
       * @api public
       */

      Page.prototype.base = function(path) {
        if (0 === arguments.length) return this._base;
        this._base = path;
      };

      /**
       * Gets the `base`, which depends on whether we are using History or
       * hashbang routing.

       * @api private
       */
      Page.prototype._getBase = function() {
        var base = this._base;
        if(!!base) return base;
        var loc = hasWindow && this._window && this._window.location;

        if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
          base = loc.pathname;
        }

        return base;
      };

      /**
       * Get or set strict path matching to `enable`
       *
       * @param {boolean} enable
       * @api public
       */

      Page.prototype.strict = function(enable) {
        if (0 === arguments.length) return this._strict;
        this._strict = enable;
      };


      /**
       * Bind with the given `options`.
       *
       * Options:
       *
       *    - `click` bind to click events [true]
       *    - `popstate` bind to popstate [true]
       *    - `dispatch` perform initial dispatch [true]
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.start = function(options) {
        var opts = options || {};
        this.configure(opts);

        if (false === opts.dispatch) return;
        this._running = true;

        var url;
        if(isLocation) {
          var window = this._window;
          var loc = window.location;

          if(this._hashbang && ~loc.hash.indexOf('#!')) {
            url = loc.hash.substr(2) + loc.search;
          } else if (this._hashbang) {
            url = loc.search + loc.hash;
          } else {
            url = loc.pathname + loc.search + loc.hash;
          }
        }

        this.replace(url, null, true, opts.dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      Page.prototype.stop = function() {
        if (!this._running) return;
        this.current = '';
        this.len = 0;
        this._running = false;

        var window = this._window;
        this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
        hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
        hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
      };

      /**
       * Show `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} dispatch
       * @param {boolean=} push
       * @return {!Context}
       * @api public
       */

      Page.prototype.show = function(path, state, dispatch, push) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        if (false !== dispatch) this.dispatch(ctx, prev);
        if (false !== ctx.handled && false !== push) ctx.pushState();
        return ctx;
      };

      /**
       * Goes back in the history
       * Back should always let the current route push state and then go back.
       *
       * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
       * @param {Object=} state
       * @api public
       */

      Page.prototype.back = function(path, state) {
        var page = this;
        if (this.len > 0) {
          var window = this._window;
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          hasHistory && window.history.back();
          this.len--;
        } else if (path) {
          setTimeout(function() {
            page.show(path, state);
          });
        } else {
          setTimeout(function() {
            page.show(page._getBase(), state);
          });
        }
      };

      /**
       * Register route to redirect from one path to other
       * or just redirect to another route
       *
       * @param {string} from - if param 'to' is undefined redirects to 'from'
       * @param {string=} to
       * @api public
       */
      Page.prototype.redirect = function(from, to) {
        var inst = this;

        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page.call(this, from, function(e) {
            setTimeout(function() {
              inst.replace(/** @type {!string} */ (to));
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function() {
            inst.replace(from);
          }, 0);
        }
      };

      /**
       * Replace `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} init
       * @param {boolean=} dispatch
       * @return {!Context}
       * @api public
       */


      Page.prototype.replace = function(path, state, init, dispatch) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        ctx.init = init;
        ctx.save(); // save before dispatching, which may redirect
        if (false !== dispatch) this.dispatch(ctx, prev);
        return ctx;
      };

      /**
       * Dispatch the given `ctx`.
       *
       * @param {Context} ctx
       * @api private
       */

      Page.prototype.dispatch = function(ctx, prev) {
        var i = 0, j = 0, page = this;

        function nextExit() {
          var fn = page.exits[j++];
          if (!fn) return nextEnter();
          fn(prev, nextExit);
        }

        function nextEnter() {
          var fn = page.callbacks[i++];

          if (ctx.path !== page.current) {
            ctx.handled = false;
            return;
          }
          if (!fn) return unhandled.call(page, ctx);
          fn(ctx, nextEnter);
        }

        if (prev) {
          nextExit();
        } else {
          nextEnter();
        }
      };

      /**
       * Register an exit route on `path` with
       * callback `fn()`, which will be called
       * on the previous context when a new
       * page is visited.
       */
      Page.prototype.exit = function(path, fn) {
        if (typeof path === 'function') {
          return this.exit('*', path);
        }

        var route = new Route(path, null, this);
        for (var i = 1; i < arguments.length; ++i) {
          this.exits.push(route.middleware(arguments[i]));
        }
      };

      /**
       * Handle "click" events.
       */

      /* jshint +W054 */
      Page.prototype.clickHandler = function(e) {
        if (1 !== this._which(e)) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return;

        // ensure link
        // use shadow dom when available if not, fall back to composedPath()
        // for browsers that only have shady
        var el = e.target;
        var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

        if(eventPath) {
          for (var i = 0; i < eventPath.length; i++) {
            if (!eventPath[i].nodeName) continue;
            if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
            if (!eventPath[i].href) continue;

            el = eventPath[i];
            break;
          }
        }

        // continue ensure link
        // el.nodeName for svg links are 'a' instead of 'A'
        while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
        if (!el || 'A' !== el.nodeName.toUpperCase()) return;

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

        // ensure non-hash for the same path
        var link = el.getAttribute('href');
        if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

        // Check for mailto: in the href
        if (link && link.indexOf('mailto:') > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !this.sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

        path = path[0] !== '/' ? '/' + path : path;

        // strip leading "/[drive letter]:" on NW.js on Windows
        if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
          path = path.replace(/^\/[a-zA-Z]:\//, '/');
        }

        // same page
        var orig = path;
        var pageBase = this._getBase();

        if (path.indexOf(pageBase) === 0) {
          path = path.substr(pageBase.length);
        }

        if (this._hashbang) path = path.replace('#!', '');

        if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
          return;
        }

        e.preventDefault();
        this.show(orig);
      };

      /**
       * Handle "populate" events.
       * @api private
       */

      Page.prototype._onpopstate = (function () {
        var loaded = false;
        if ( ! hasWindow ) {
          return function () {};
        }
        if (hasDocument && document.readyState === 'complete') {
          loaded = true;
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              loaded = true;
            }, 0);
          });
        }
        return function onpopstate(e) {
          if (!loaded) return;
          var page = this;
          if (e.state) {
            var path = e.state.path;
            page.replace(path, e.state);
          } else if (isLocation) {
            var loc = page._window.location;
            page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
          }
        };
      })();

      /**
       * Event button.
       */
      Page.prototype._which = function(e) {
        e = e || (hasWindow && this._window.event);
        return null == e.which ? e.button : e.which;
      };

      /**
       * Convert to a URL object
       * @api private
       */
      Page.prototype._toURL = function(href) {
        var window = this._window;
        if(typeof URL === 'function' && isLocation) {
          return new URL(href, window.location.toString());
        } else if (hasDocument) {
          var anc = window.document.createElement('a');
          anc.href = href;
          return anc;
        }
      };

      /**
       * Check if `href` is the same origin.
       * @param {string} href
       * @api public
       */
      Page.prototype.sameOrigin = function(href) {
        if(!href || !isLocation) return false;

        var url = this._toURL(href);
        var window = this._window;

        var loc = window.location;

        /*
           When the port is the default http port 80 for http, or 443 for
           https, internet explorer 11 returns an empty string for loc.port,
           so we need to compare loc.port with an empty string if url.port
           is the default port 80 or 443.
           Also the comparition with `port` is changed from `===` to `==` because
           `port` can be a string sometimes. This only applies to ie11.
        */
        return loc.protocol === url.protocol &&
          loc.hostname === url.hostname &&
          (loc.port === url.port || loc.port === '' && (url.port == 80 || url.port == 443)); // jshint ignore:line
      };

      /**
       * @api private
       */
      Page.prototype._samePath = function(url) {
        if(!isLocation) return false;
        var window = this._window;
        var loc = window.location;
        return url.pathname === loc.pathname &&
          url.search === loc.search;
      };

      /**
       * Remove URL encoding from the given `str`.
       * Accommodates whitespace in both x-www-form-urlencoded
       * and regular percent-encoded form.
       *
       * @param {string} val - URL component to decode
       * @api private
       */
      Page.prototype._decodeURLEncodedURIComponent = function(val) {
        if (typeof val !== 'string') { return val; }
        return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
      };

      /**
       * Create a new `page` instance and function
       */
      function createPage() {
        var pageInstance = new Page();

        function pageFn(/* args */) {
          return page.apply(pageInstance, arguments);
        }

        // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
        pageFn.callbacks = pageInstance.callbacks;
        pageFn.exits = pageInstance.exits;
        pageFn.base = pageInstance.base.bind(pageInstance);
        pageFn.strict = pageInstance.strict.bind(pageInstance);
        pageFn.start = pageInstance.start.bind(pageInstance);
        pageFn.stop = pageInstance.stop.bind(pageInstance);
        pageFn.show = pageInstance.show.bind(pageInstance);
        pageFn.back = pageInstance.back.bind(pageInstance);
        pageFn.redirect = pageInstance.redirect.bind(pageInstance);
        pageFn.replace = pageInstance.replace.bind(pageInstance);
        pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
        pageFn.exit = pageInstance.exit.bind(pageInstance);
        pageFn.configure = pageInstance.configure.bind(pageInstance);
        pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
        pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

        pageFn.create = createPage;

        Object.defineProperty(pageFn, 'len', {
          get: function(){
            return pageInstance.len;
          },
          set: function(val) {
            pageInstance.len = val;
          }
        });

        Object.defineProperty(pageFn, 'current', {
          get: function(){
            return pageInstance.current;
          },
          set: function(val) {
            pageInstance.current = val;
          }
        });

        // In 2.0 these can be named exports
        pageFn.Context = Context;
        pageFn.Route = Route;

        return pageFn;
      }

      /**
       * Register `path` with callback `fn()`,
       * or route `path`, or redirection,
       * or `page.start()`.
       *
       *   page(fn);
       *   page('*', fn);
       *   page('/user/:id', load, user);
       *   page('/user/' + user.id, { some: 'thing' });
       *   page('/user/' + user.id);
       *   page('/from', '/to')
       *   page();
       *
       * @param {string|!Function|!Object} path
       * @param {Function=} fn
       * @api public
       */

      function page(path, fn) {
        // <callback>
        if ('function' === typeof path) {
          return page.call(this, '*', path);
        }

        // route <path> to <callback ...>
        if ('function' === typeof fn) {
          var route = new Route(/** @type {string} */ (path), null, this);
          for (var i = 1; i < arguments.length; ++i) {
            this.callbacks.push(route.middleware(arguments[i]));
          }
          // show <path> with [state]
        } else if ('string' === typeof path) {
          this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
          // start [options]
        } else {
          this.start(path);
        }
      }

      /**
       * Unhandled `ctx`. When it's not the initial
       * popstate then redirect. If you wish to handle
       * 404s on your own use `page('*', callback)`.
       *
       * @param {Context} ctx
       * @api private
       */
      function unhandled(ctx) {
        if (ctx.handled) return;
        var current;
        var page = this;
        var window = page._window;

        if (page._hashbang) {
          current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
        } else {
          current = isLocation && window.location.pathname + window.location.search;
        }

        if (current === ctx.canonicalPath) return;
        page.stop();
        ctx.handled = false;
        isLocation && (window.location.href = ctx.canonicalPath);
      }

      /**
       * Escapes RegExp characters in the given string.
       *
       * @param {string} s
       * @api private
       */
      function escapeRegExp(s) {
        return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      }

      /**
       * Initialize a new "request" `Context`
       * with the given `path` and optional initial `state`.
       *
       * @constructor
       * @param {string} path
       * @param {Object=} state
       * @api public
       */

      function Context(path, state, pageInstance) {
        var _page = this.page = pageInstance || page;
        var window = _page._window;
        var hashbang = _page._hashbang;

        var pageBase = _page._getBase();
        if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
        var i = path.indexOf('?');

        this.canonicalPath = path;
        var re = new RegExp('^' + escapeRegExp(pageBase));
        this.path = path.replace(re, '') || '/';
        if (hashbang) this.path = this.path.replace('#!', '') || '/';

        this.title = (hasDocument && window.document.title);
        this.state = state || {};
        this.state.path = path;
        this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
        this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
        this.params = {};

        // fragment
        this.hash = '';
        if (!hashbang) {
          if (!~this.path.indexOf('#')) return;
          var parts = this.path.split('#');
          this.path = this.pathname = parts[0];
          this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
          this.querystring = this.querystring.split('#')[0];
        }
      }

      /**
       * Push state.
       *
       * @api private
       */

      Context.prototype.pushState = function() {
        var page = this.page;
        var window = page._window;
        var hashbang = page._hashbang;

        page.len++;
        if (hasHistory) {
            window.history.pushState(this.state, this.title,
              hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function() {
        var page = this.page;
        if (hasHistory) {
            page._window.history.replaceState(this.state, this.title,
              page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Initialize `Route` with the given HTTP `path`,
       * and an array of `callbacks` and `options`.
       *
       * Options:
       *
       *   - `sensitive`    enable case-sensitive routes
       *   - `strict`       enable strict matching for trailing slashes
       *
       * @constructor
       * @param {string} path
       * @param {Object=} options
       * @api private
       */

      function Route(path, options, page) {
        var _page = this.page = page || globalPage;
        var opts = options || {};
        opts.strict = opts.strict || _page._strict;
        this.path = (path === '*') ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
      }

      /**
       * Return route middleware with
       * the given callback `fn()`.
       *
       * @param {Function} fn
       * @return {Function}
       * @api public
       */

      Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
          if (self.match(ctx.path, ctx.params)) {
            ctx.routePath = self.path;
            return fn(ctx, next);
          }
          next();
        };
      };

      /**
       * Check if this route matches `path`, if so
       * populate `params`.
       *
       * @param {string} path
       * @param {Object} params
       * @return {boolean}
       * @api private
       */

      Route.prototype.match = function(path, params) {
        var keys = this.keys,
          qsIndex = path.indexOf('?'),
          pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
          m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;

        delete params[0];

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = this.page._decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
            params[key.name] = val;
          }
        }

        return true;
      };


      /**
       * Module exports.
       */

      var globalPage = createPage();
      var page_js = globalPage;
      var default_1 = globalPage;

    page_js.default = default_1;

    return page_js;

    })));
    });

    var projects = [
      {
        id: Math.random() * Date.now(),
        name: "Predicting Home Prices - Machine Learning",
        summary:
          "When designing this project, the objective was to build a machine learning algorithm from scratch. I wanted to work on prediction using various statistical models, and really focused on some of the following: Lasso Ridge, Gradient Boost, Regression with various polynomials. I also wanted to see the impact of a correct model that was binarized and data that was not handled correctly (un-binarized). The model was broken into two different sets, one training and one test. What made this project so unique? Well besides all of the various statistical modeling and using a 10-fold cross-validation, there was significant preprocessing that had to happen. I needed to do imputations, drop columns that created over-fitting, and had to standardize the data. The end results where quite spectacular, I actually did pretty well and managed to achieve an accuracy around 12% on the competition. As exciting as this project is I could write pages about it but instead check out the code on the GitHub link below!",
        images: ["./assets/MLPicture1.png", "./assets/ML Results.png"],
        tools: ["Python", "sklearn", "scipy", "matplotlib", "pandas", "numpy"],
        filter: ["python", "machine learning"]
      },
      {
        id: Math.random() * Date.now(),
        name: "Custom Timing Decorator",
        summary:
          "When thinking about code performance and reusability. I noticed that a lot of times I kept using some of the normal start.time() and end.time() code to check out performance. As data keeps getting larger I really needed to focus some on the computation time. I decided to create a decorator that I could through on top of my functions/methods to get an idea of the performance. Though it isn’t what we would normally call as a standard time of project, it does have a purpose. The point of putting it here is to show you that I constantly think of improving, that I pay attention to performance and Big-O problems and lastly having modules for reusability help with scale and readability. I hope you enjoy checking out the code below!",
        images: ["./assets/Decorator.PNG"],
        tools: ["Python"],
        filter: ["python"]
      },
      {
        id: Math.random() * Date.now(),
        name: "Pace Distribution by Gender – 2014 Boston Marathon",
        summary:
          "As an avid runner, I was curious about the Boston Marathon distribution. (One day I hope to make it). I wanted to create an interactive plot to highlight age and gender difference with a boxplot to show distribution. I gathered the data from the 2014 Boston Marathon, I then proceeded to do preprocessing. Besides cleaning up data, I also needed to establish groups for age and time performance. ",
        images: ["./assets/Pace Distribution By Gender.PNG"],
        tools: ["R", "Plotly"],
        filter: ["r", "data mining", "visualizations"]
      },
      {
        id: Math.random() * Date.now(),
        name: "Exploratory Analysis Tool",
        summary:
          "I worked with another talented Programmer to develop a tool that could compete with Tableau. The idea was that we wanted to build something we felt would not only more intuitive but also work with future developmental needs such as Machine Learning, Regressions, and other Data Science needs. We wanted to use Svelte / JavaScript for its reactivity. We also wanted to use Python for its integration to Django and its vast amount of libraries which would allow for Machine Learning, Regression, and other future development ideas. Celery and Redis where a by-product due to the long running tasks. We integrated this to handle some of our really long tasks, along with some other asynchronous functions. The end result was for individuals to use drag and drop to visually explore their data. We also developed tools for them to quickly interact / change / preprocess their data. We incorporated ways to handle missing data with imputations, to change data types etc. Though this is still in development check out some of the features in the pictures below! Would love to connect more to discuss this at anytime.",
        images: [],
        tools: [
          "Svelte",
          "JavaScript",
          "D3",
          "Python",
          "SQL",
          "Django",
          "Redis",
          "Celery"
        ],
        filter: [
          "svetle",
          "javascript",
          "python",
          "d3",
          "database",
          "visualizations"
        ]
      },
      {
        id: Math.random() * Date.now(),
        name: "Income Prediction – Machine Learning ",
        summary:
          "This was a Kaggle competition to predict income of individuals based on education, gender, location, race, type of employment, position, and age. For this competition in particular it was for a classifier of different income levels, and for that reason I choose to use a KNN as my model of choice. I ran a train and test data with various nearest neighbors. I found the point to where overfitting started to occur and used the optimal test error to fit my model. Though a neural network might have been a better option this was done about a year before I felt comfortable with it. I also incorporated a bias when helping train the model to adjust overfitting. I had found that using an average perceptron with 5 epochs gave me the best results at 5 epochs which results in a 14.8% error. Check out the code below!",
        images: [
          "./assets/Income Prediction Epoch results.png",
          "./assets/Income Prediction Code Example.png"
        ],
        tools: ["Python", "Numpy", "Data Mining", "Preproessing"],
        filter: ["python", "machine learning"]
      },
      {
        id: Math.random() * Date.now(),
        name: "Accident! Analysis of New Zealand accident data with Poisson models",
        summary:
          "An understanding of road safety is critical for transportation officials and is also of interest to the general public. Two common modes of transportation are cars and motorcycles. Drivers may be interested to know whether being involved in a car accident with injuries would have a high chance of fatality. Motorcycle riders might want to know if weekends are safer for them to ride over weekdays with the commuter traffic. The purpose of this study is to analyze data on car and motorcycle accidents in New Zealand to answer the following two questions: Objective 1 - Is there a statistical difference in New Zealand reported car accidents with injuries vs accidents with fatalities by day of week or time of day? Objective 2 - Is a motorcyclist more likely to get in a reported accident on the weekday or the weekend in New Zealand? To answer these questions, I performed a simple exploratory analysis, and developed hypotheses. With the hypothesis in mind, I selected my primary model and fit multiple models to compare against. Next, I fit the residuals and made conclusions about the objectives of interest.",
        images: [
          "./assets/Poisson.png",
          "./assets/Accident Plots.png",
          "./assets/Accident Residuals.png"
        ],
        tools: ["R", "ggplot"],
        filter: ["r", "visualizations", "technical reports"]
      },
      {
        id: Math.random() * Date.now(),
        name:
          "Climate Change Contributor: Predicting Motor Vehicle Emissions with Time Series Techniques",
        summary:
          "𝐶𝑂2 emissions are known to be a key contributor to global climate change. A significant source of 𝐶𝑂2 emissions in the United States is from gas powered motor vehicles. To better understand emissions trajectory, I conducted a time series analysis of monthly motor vehicle 𝐶𝑂2 emissions in metric megatonnes from gasoline (excluding ethanol) in the United States for the time period between January 1973 and June 2013. I used four different time series techniques to gain a deeper understanding of the data and to set myself up to predict the next 24 months of emission levels. The techniques that I used were ARMA, (S)ARIMA, Holt-Winters Exponential Smoothing, and Spectral Analysis. Each method has a different approach to examining the time series, and my aim was to understand how they can be used to help with prediction analysis.",
        images: [
          "./assets/CO2 Prediction.png",
          "./assets/CO2 Example Code.png",
          "./assets/CO2 Residuals.png"
        ],
        tools: ["R", "ggplot"],
        filter: ["r", "visualizations", "technical reports"]
      },
      {
        id: Math.random() * Date.now(),
        name: "Dynamic Customer Analysis",
        summary:
          "The objective was to create a dynamic visualization that allowed the manager to see key metrics quickly. The dashboard was dynamic in the sense that when a filtered change in essence the captions and title changed to reflect the appropriate notes / individual. The data was modified and does not reflect true performance since it was proprietary information, however the key here is to see that I believe strongly in visualizations and their role in analytics. Also, I want to note that I am able to meet various business needs. This data required an intensive Extract, Transform and Load process (ETL) in order for me to capture these different metrics with accuracy. I wish I could share the file, however we can also look to see what visualizations and dashboards I can build for you!",
        images: ["./assets/Dynamic Caption.PNG"],
        tools: ["Tableau", "Data Mining"],
        filter: ["tableau", "database", "visualizations"]
      },
      {
        id: Math.random() * Date.now(),
        name: "Top 20 Customers",
        summary:
          "This project was unique in the sense that I had to create and maintain my own standing databases [Structured and Unsctructed] due to an operating agreement. Here I wanted to access one of the databases to give me the top 20 customers by year based on specific criteria. You can see this unique SQL code below that I used to run this report!",
        images: ["./assets/Top 20 Customers by Single Calendar Year.png"],
        tools: ["Database", "SQL"],
        filter: ["database", "sql"]
      },
      {
        id: Math.random() * Date.now(),
        name: "Digital Metrics",
        summary:
          "This was an interactive dashboard project to allow users (me) to filter / view various digital metrics quickly. Things like Bounce Rate, Click Through Rate, Viewership, etc. Imagine some of the visualizations I can build for you!",
        images: ["./assets/Bounce Rate.PNG"],
        tools: ["Tableau", "Google Analytics", "API"],
        filter: ["tableau", "visualizations"]
      },
      {
        id: Math.random() * Date.now(),
        name: "Budget Database",
        summary:
          "One problem I consistently ran into, was the ever changing budget iterations. Not only is it difficult to hold state of budget changes, but to consistenly get things mapped to their corresponding endpoints such as team performance, GL, Products etc. So, I created a database that I could use year after year to hold the state of various budget iterations and allow for proper allocations to their correspoding endpoints.",
        images: ["./assets/Budget_DB.png"],
        tools: ["Database", "SQL"],
        filter: ["database", "sql"]
      },
      {
        id: Math.random() * Date.now(),
        name: "Demographics by Region",
        summary:
          "One key component of any company is to know your customer! I wanted to build a tool to allow our company to understand where our customers are coming from so we could really deep dive into their demographics. This was a dashboard [data has been modified and does not represent actual] to allow the user to see where our customers are coming from for our digital platforms, what age groups, and how it performed. This was one dashboard in a sequence of dashboards to help tell the story. All of this had filters, and drill down ability to give the users the best tool possible! What can we build together?",
        images: ["./assets/Demographic.png"],
        tools: ["Tableau", "Data Mining", "Google Analytics", "API"],
        filter: ["tableau", "database", "visualizations"]
      },
      {
        id: Math.random() * Date.now(),
        name: "This website!",
        summary:
          "I wanted to build this website from the ground up, no cookie cutter site for me! Here you can see some of the JavaScript, CSS, and Svelte skills I have by showing my portfolio through a portfolio project. I hope you are enjoying it!",
        images: ["./assets/this site.PNG"],
        tools: ["Svelte", "JavaScript"],
        filter: ["svetle", "javascript"]
      },
      {
        id: Math.random() * Date.now(),
        name:
          "Investigating the effects of race and gender on income using generalized linear models and penalized regression model",
        summary:
          "In recent years there have been many different social discussions over the impact of race, sex, education and other factors on income. These questions can be investigated with census data. In this analysis I used census data for the state of Oregon from 2013-2017 to examine four questions of interest: 1) Does race affect income, 2) how does gender affect total income, 3) does education or hours worked per  a larger impact on total income, and 4) what is the relationship between hours of work and education attainment? I hypothesized that: 1) there is no difference between the different races and the affect that they have on income, 2) there is no difference in income between males and females, 3) there is no difference in the effect of education and hours worked per week on total income, and 4) there is no relation between hours of work and years of education. The alternative to these four hypotheses is that there is a difference. To make inference on these hypotheses I used a generalized linear model and model diagnostics that included penalized regression.",
        images: [
          "./assets/Race and Gender by Industry.PNG",
          "./assets/Model Selection.PNG",
          "./assets/residuals of SCHL.PNG"
        ],
        tools: ["R", "ggplot"],
        filter: ["r", "visualizations", "technical reports"]
      }
    ];

    const getHref = (name) => {
            return "/" + name.split(" ").map(x => x.toLowerCase()).join("-");
        };

    /* src\pages\ProjectTemplate.svelte generated by Svelte v3.18.1 */

    const { console: console_1 } = globals;
    const file$1 = "src\\pages\\ProjectTemplate.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (38:4) {#if projectInfo.images.length > 1}
    function create_if_block(ctx) {
    	let div;
    	let each_value_1 = /*projectInfo*/ ctx[0].images;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "thumbnails svelte-5r0gr9");
    			add_location(div, file$1, 38, 6, 895);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*projectInfo, photoIndex*/ 3) {
    				each_value_1 = /*projectInfo*/ ctx[0].images;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(38:4) {#if projectInfo.images.length > 1}",
    		ctx
    	});

    	return block;
    }

    // (40:8) {#each projectInfo.images as images_to_display, idx}
    function create_each_block_1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*idx*/ ctx[9], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t = space();
    			if (img.src !== (img_src_value = /*images_to_display*/ ctx[7])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Image");
    			attr_dev(img, "width", "100");
    			attr_dev(img, "height", "100");
    			attr_dev(img, "class", "svelte-5r0gr9");
    			add_location(img, file$1, 41, 12, 1012);
    			add_location(div, file$1, 40, 10, 993);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t);
    			dispose = listen_dev(img, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*projectInfo*/ 1 && img.src !== (img_src_value = /*images_to_display*/ ctx[7])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(40:8) {#each projectInfo.images as images_to_display, idx}",
    		ctx
    	});

    	return block;
    }

    // (64:6) {#each projectInfo.tools as tool}
    function create_each_block(ctx) {
    	let div;
    	let t_value = /*tool*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "pill svelte-5r0gr9");
    			add_location(div, file$1, 64, 8, 1512);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*projectInfo*/ 1 && t_value !== (t_value = /*tool*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(64:6) {#each projectInfo.tools as tool}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div5;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let t1;
    	let div4;
    	let h3;
    	let t2_value = /*projectInfo*/ ctx[0].name + "";
    	let t2;
    	let t3;
    	let div2;
    	let p;
    	let t4_value = /*projectInfo*/ ctx[0].summary + "";
    	let t4;
    	let t5;
    	let h4;
    	let t7;
    	let div3;
    	let if_block = /*projectInfo*/ ctx[0].images.length > 1 && create_if_block(ctx);
    	let each_value = /*projectInfo*/ ctx[0].tools;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			div4 = element("div");
    			h3 = element("h3");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			p = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			h4 = element("h4");
    			h4.textContent = "Tools:";
    			t7 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (img.src !== (img_src_value = /*projectInfo*/ ctx[0].images[/*photoIndex*/ ctx[1]])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Image");
    			attr_dev(img, "width", "100%");
    			attr_dev(img, "height", "auto");
    			attr_dev(img, "class", "svelte-5r0gr9");
    			add_location(img, file$1, 30, 6, 713);
    			attr_dev(div0, "id", "featured-photo");
    			attr_dev(div0, "class", "svelte-5r0gr9");
    			add_location(div0, file$1, 29, 4, 680);
    			attr_dev(div1, "class", "column svelte-5r0gr9");
    			add_location(div1, file$1, 28, 2, 654);
    			attr_dev(h3, "class", "svelte-5r0gr9");
    			add_location(h3, file$1, 54, 4, 1293);
    			attr_dev(p, "class", "subhead svelte-5r0gr9");
    			add_location(p, file$1, 57, 6, 1355);
    			attr_dev(div2, "class", "intro svelte-5r0gr9");
    			add_location(div2, file$1, 56, 4, 1328);
    			attr_dev(h4, "class", "svelte-5r0gr9");
    			add_location(h4, file$1, 61, 4, 1421);
    			attr_dev(div3, "class", "pills svelte-5r0gr9");
    			add_location(div3, file$1, 62, 4, 1442);
    			attr_dev(div4, "class", "column svelte-5r0gr9");
    			add_location(div4, file$1, 53, 2, 1267);
    			attr_dev(div5, "class", "project-template svelte-5r0gr9");
    			add_location(div5, file$1, 27, 0, 620);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, h3);
    			append_dev(h3, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, p);
    			append_dev(p, t4);
    			append_dev(div4, t5);
    			append_dev(div4, h4);
    			append_dev(div4, t7);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*projectInfo, photoIndex*/ 3 && img.src !== (img_src_value = /*projectInfo*/ ctx[0].images[/*photoIndex*/ ctx[1]])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (/*projectInfo*/ ctx[0].images.length > 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*projectInfo*/ 1 && t2_value !== (t2_value = /*projectInfo*/ ctx[0].name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*projectInfo*/ 1 && t4_value !== (t4_value = /*projectInfo*/ ctx[0].summary + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*projectInfo*/ 1) {
    				each_value = /*projectInfo*/ ctx[0].tools;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { params } = $$props;
    	let projectInfo = {};
    	let photoIndex = 0;
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<ProjectTemplate> was created with unknown prop '${key}'`);
    	});

    	const click_handler = idx => $$invalidate(1, photoIndex = idx);

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    	};

    	$$self.$capture_state = () => {
    		return { params, projectInfo, photoIndex };
    	};

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    		if ("projectInfo" in $$props) $$invalidate(0, projectInfo = $$props.projectInfo);
    		if ("photoIndex" in $$props) $$invalidate(1, photoIndex = $$props.photoIndex);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params*/ 4) {
    			//   onMount(() => {
    			// console.log("Params", params);
    			 if (projects != null) {
    				for (let i = 0; i < projects.length; i++) {
    					let name = getHref(projects[i].name).slice(1);

    					if (params.projectName == name) {
    						$$invalidate(0, projectInfo = projects[i]);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*photoIndex*/ 2) {
    			 console.log("photoIndex=", photoIndex);
    		}
    	};

    	return [projectInfo, photoIndex, params, click_handler];
    }

    class ProjectTemplate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, { params: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectTemplate",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[2] === undefined && !("params" in props)) {
    			console_1.warn("<ProjectTemplate> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<ProjectTemplate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ProjectTemplate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }

    function blur(node, { delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const f = style.filter === 'none' ? '' : style.filter;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `opacity: ${target_opacity - (od * u)}; filter: ${f} blur(${u * amount}px);`
        };
    }

    var skills = [
        {
            id: 1,
            name: "Python",
            url: "/python",
            src: "./assets/Python.png",
            blurb: "Python is my go to programming langauge for indepth analysis, data mining, machine learning, or automation."
        },
        {
            id: 2,
            name: "R",
            url: "/R",
            src: "./assets/R.jfif",
            blurb: "R is my go to programming langauge for statistical analysis, technical reports, or exploratory anlysis."
        },
        {
            id: 3,
            name: "JavaScript",
            url: "/JavaScript",
            src: "./assets/JS.png",
            blurb: "JavaScript is a great frontend development tool for website functionality. My framework of preference is Svelte, even this website is built in it!"
        },
        {
            id: 5,
            name: "Database",
            url: "/Database",
            src: "./assets/Database.png",
            blurb: "Experience with structured and unstructred data, extense use of SQL, and helping structure relational databases."
        },
        {
            id: 6,
            name: "Tableau",
            url: "/Tableau",
            src: "./assets/Tableau.jpg",
            blurb: "Love Tableau for quick analysis, dashboard distributions, or requiring report visualizations."
        },
        // {
        //     id: 7,
        //     name: "DataMining",
        //     url: "/DataMining",
        //     src: "./assets/DM.png",
        //     blurb: "For Data Mining I use Python and R to help find anomalies, patterns or correlations in the data."
        // },
        // {
        //     id: 8,
        //     name: "Google Analytics",
        //     url: "/Google Analytics",
        //     src: "./assets/GA.png",
        //     blurb: "Report and analyze real-time organizational web traffic, and user interactions with the websties."
        // },
        {
            id: 9,
            name: "Machine Learning",
            url: "/Machine Learning",
            src: "./assets/ML.jpg",
            blurb: "Experience in supervised, unsupervised, and semi-supervised machine learning projects for predictions."
        },
        {
            id: 10,
            name: "Technical Reports",
            url: "/TechReports",
            src: "./assets/TechnicalReport.png",
            blurb: "Experience in writing technical statistical reports for detailed communication at variance end user techincal levels."
        }, 
        // {
        //     id: 11,
        //     name: "Svelte",
        //     url: "/Svelte",
        //     src: "./assets/SvelteLogo.png",
        //     blurb: "Written two web pages in svelte."
        // },
        {
            id: 12,
            name: "Visualizations",
            url: "/Visualizations",
            src: "./assets/Visualization.jpg",
            blurb: "Meaniningful way to quickly communicate either abstract or conrete ideas, experience in Tableau, D3, matplotlib, gglot, and ploty."
        }, {
            id: 13,
            name: "More to Come",
            src: "./assets/Learning.jpg",
            url: "#proficiencies",
            blurb: "I have such a love for learning, and continious growth of my skills! Check back with me soon and see what more there is!"
        },
    ];

    /* src\Proficiencies.svelte generated by Svelte v3.18.1 */
    const file$2 = "src\\Proficiencies.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (20:2) {#each skillData as skill, index (skill.id)}
    function create_each_block$1(key_1, ctx) {
    	let div1;
    	let a;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_transition;
    	let t0;
    	let div0;
    	let t1_value = /*skill*/ ctx[4].blurb + "";
    	let t1;
    	let t2;
    	let current;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*skill*/ ctx[4], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div1 = element("div");
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (img.src !== (img_src_value = /*skill*/ ctx[4].src)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*skill*/ ctx[4].name);
    			attr_dev(img, "class", "svelte-51a58r");
    			add_location(img, file$2, 22, 6, 500);
    			attr_dev(div0, "class", "blurb svelte-51a58r");
    			add_location(div0, file$2, 27, 4, 628);
    			attr_dev(a, "href", "#projects");
    			attr_dev(a, "class", "svelte-51a58r");
    			add_location(a, file$2, 21, 4, 431);
    			attr_dev(div1, "class", "sub-skill svelte-51a58r");
    			add_location(div1, file$2, 20, 4, 402);
    			this.first = div1;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a);
    			append_dev(a, img);
    			append_dev(a, t0);
    			append_dev(a, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    			current = true;
    			dispose = listen_dev(a, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!img_transition) img_transition = create_bidirectional_transition(img, blur, { duration: 2000, amount: 20 }, true);
    				img_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!img_transition) img_transition = create_bidirectional_transition(img, blur, { duration: 2000, amount: 20 }, false);
    			img_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && img_transition) img_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(20:2) {#each skillData as skill, index (skill.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = skills;
    	const get_key = ctx => /*skill*/ ctx[4].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "skill_type svelte-51a58r");
    			add_location(div, file$2, 18, 0, 324);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const each_value = skills;
    			group_outros();
    			validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    			check_outros();
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let skills$1 = [];
    	let { projectFilter } = $$props;

    	// lifecycle
    	onMount(() => skills$1 = skills);

    	const filterProject = name => {
    		$$invalidate(1, projectFilter = name);
    	};

    	const writable_props = ["projectFilter"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Proficiencies> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (skill, e) => filterProject(skill.name);

    	$$self.$set = $$props => {
    		if ("projectFilter" in $$props) $$invalidate(1, projectFilter = $$props.projectFilter);
    	};

    	$$self.$capture_state = () => {
    		return { skills: skills$1, projectFilter };
    	};

    	$$self.$inject_state = $$props => {
    		if ("skills" in $$props) skills$1 = $$props.skills;
    		if ("projectFilter" in $$props) $$invalidate(1, projectFilter = $$props.projectFilter);
    	};

    	return [filterProject, projectFilter, skills$1, click_handler];
    }

    class Proficiencies extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, { projectFilter: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Proficiencies",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*projectFilter*/ ctx[1] === undefined && !("projectFilter" in props)) {
    			console.warn("<Proficiencies> was created without expected prop 'projectFilter'");
    		}
    	}

    	get projectFilter() {
    		throw new Error("<Proficiencies>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectFilter(value) {
    		throw new Error("<Proficiencies>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\About.svelte generated by Svelte v3.18.1 */

    const file$3 = "src\\About.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let h3;
    	let t1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "As a data scientist. I value integrity, communication, and problem\r\n      solving. My values help me organize facts in systematic ways that\r\n      influence decision making through clear communication. As a result, I can\r\n      think of new ways to make an impactful difference in real life problems. I\r\n      would like to be known for great reliable and accurate work that can be\r\n      counted on in a continuous basis.";
    			t1 = space();
    			div0 = element("div");
    			attr_dev(h3, "class", "about svelte-yvb9ao");
    			add_location(h3, file$3, 5, 0, 46);
    			attr_dev(div0, "class", "background-image svelte-yvb9ao");
    			set_style(div0, "background-image", "url(./assets/pp.JPG)");
    			add_location(div0, file$3, 14, 0, 505);
    			attr_dev(div1, "class", "outer svelte-yvb9ao");
    			add_location(div1, file$3, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Cards.svelte generated by Svelte v3.18.1 */

    const { console: console_1$1 } = globals;
    const file$4 = "src\\Cards.svelte";

    function create_fragment$5(ctx) {
    	let div1;
    	let a;
    	let h3_1;
    	let t0_value = /*project*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			a = element("a");
    			h3_1 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			img = element("img");
    			attr_dev(h3_1, "class", "svelte-2uquvx");
    			add_location(h3_1, file$4, 23, 4, 545);
    			if (img.src !== (img_src_value = /*project*/ ctx[0].images[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*project*/ ctx[0].name);
    			add_location(img, file$4, 25, 6, 640);
    			attr_dev(div0, "class", "image-class svelte-2uquvx");
    			add_location(div0, file$4, 24, 4, 589);
    			attr_dev(a, "href", a_href_value = getHref(/*project*/ ctx[0].name));
    			attr_dev(a, "class", "svelte-2uquvx");
    			add_location(a, file$4, 22, 2, 488);
    			attr_dev(div1, "class", "card svelte-2uquvx");
    			add_location(div1, file$4, 21, 0, 466);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a);
    			append_dev(a, h3_1);
    			append_dev(h3_1, t0);
    			/*h3_1_binding*/ ctx[4](h3_1);
    			append_dev(a, t1);
    			append_dev(a, div0);
    			append_dev(div0, img);
    			/*div0_binding*/ ctx[5](div0);
    			/*a_binding*/ ctx[6](a);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*project*/ 1 && t0_value !== (t0_value = /*project*/ ctx[0].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*project*/ 1 && img.src !== (img_src_value = /*project*/ ctx[0].images[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*project*/ 1 && img_alt_value !== (img_alt_value = /*project*/ ctx[0].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*project*/ 1 && a_href_value !== (a_href_value = getHref(/*project*/ ctx[0].name))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*h3_1_binding*/ ctx[4](null);
    			/*div0_binding*/ ctx[5](null);
    			/*a_binding*/ ctx[6](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { project } = $$props;
    	let anchor;
    	let h3;
    	let image;
    	const writable_props = ["project"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Cards> was created with unknown prop '${key}'`);
    	});

    	function h3_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, h3 = $$value);
    		});
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, image = $$value);
    		});
    	}

    	function a_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, anchor = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("project" in $$props) $$invalidate(0, project = $$props.project);
    	};

    	$$self.$capture_state = () => {
    		return { project, anchor, h3, image };
    	};

    	$$self.$inject_state = $$props => {
    		if ("project" in $$props) $$invalidate(0, project = $$props.project);
    		if ("anchor" in $$props) $$invalidate(1, anchor = $$props.anchor);
    		if ("h3" in $$props) $$invalidate(2, h3 = $$props.h3);
    		if ("image" in $$props) $$invalidate(3, image = $$props.image);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*image, anchor, h3*/ 14) {
    			 if (image) {
    				console.log(" anchor H3 ParseIntH3", anchor.offsetHeight, h3.offsetHeight, parseInt(window.getComputedStyle(h3).marginBottom));
    				$$invalidate(3, image.style.height = `${anchor.offsetHeight - h3.offsetHeight - parseInt(window.getComputedStyle(h3).marginBottom)}px`, image);
    			}
    		}
    	};

    	return [project, anchor, h3, image, h3_1_binding, div0_binding, a_binding];
    }

    class Cards extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$5, safe_not_equal, { project: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cards",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*project*/ ctx[0] === undefined && !("project" in props)) {
    			console_1$1.warn("<Cards> was created without expected prop 'project'");
    		}
    	}

    	get project() {
    		throw new Error("<Cards>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set project(value) {
    		throw new Error("<Cards>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Projects.svelte generated by Svelte v3.18.1 */
    const file$5 = "src\\Projects.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (23:2) {#each [{ name: 'All' }, ...skills.slice(0, -1)] as skill}
    function create_each_block_1$1(ctx) {
    	let button;
    	let t0_value = /*skill*/ ctx[7].name + "";
    	let t0;
    	let t1;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*skill*/ ctx[7], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "svelte-198xrho");
    			toggle_class(button, "selected", /*projectFilter*/ ctx[0] == /*skill*/ ctx[7].name.toLowerCase() || /*projectFilter*/ ctx[0] == null && /*skill*/ ctx[7].name == "All");
    			add_location(button, file$5, 23, 4, 649);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			dispose = listen_dev(button, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*projectFilter, skills*/ 1) {
    				toggle_class(button, "selected", /*projectFilter*/ ctx[0] == /*skill*/ ctx[7].name.toLowerCase() || /*projectFilter*/ ctx[0] == null && /*skill*/ ctx[7].name == "All");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(23:2) {#each [{ name: 'All' }, ...skills.slice(0, -1)] as skill}",
    		ctx
    	});

    	return block;
    }

    // (32:2) {#each filteredProjects as project}
    function create_each_block$2(ctx) {
    	let current;

    	const cards = new Cards({
    			props: { project: /*project*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cards.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cards, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cards_changes = {};
    			if (dirty & /*filteredProjects*/ 2) cards_changes.project = /*project*/ ctx[4];
    			cards.$set(cards_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cards.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cards.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cards, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(32:2) {#each filteredProjects as project}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let current;
    	let each_value_1 = [{ name: "All" }, ...skills.slice(0, -1)];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*filteredProjects*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "filter-buttons svelte-198xrho");
    			add_location(div0, file$5, 21, 0, 553);
    			attr_dev(div1, "class", "card-container svelte-198xrho");
    			add_location(div1, file$5, 30, 0, 879);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*projectFilter, skills, filterBySkill*/ 5) {
    				each_value_1 = [{ name: "All" }, ...skills.slice(0, -1)];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*filteredProjects*/ 2) {
    				each_value = /*filteredProjects*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { projectFilter } = $$props;

    	const filterBySkill = name => {
    		$$invalidate(0, projectFilter = name == "All" ? null : name.toLowerCase());
    	};

    	const writable_props = ["projectFilter"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	const click_handler = skill => filterBySkill(skill.name);

    	$$self.$set = $$props => {
    		if ("projectFilter" in $$props) $$invalidate(0, projectFilter = $$props.projectFilter);
    	};

    	$$self.$capture_state = () => {
    		return { projectFilter, filteredProjects };
    	};

    	$$self.$inject_state = $$props => {
    		if ("projectFilter" in $$props) $$invalidate(0, projectFilter = $$props.projectFilter);
    		if ("filteredProjects" in $$props) $$invalidate(1, filteredProjects = $$props.filteredProjects);
    	};

    	let filteredProjects;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*projectFilter*/ 1) {
    			 $$invalidate(1, filteredProjects = projectFilter == null
    			? projects
    			: projects.filter(project => {
    					return project.filter.includes(projectFilter.toLowerCase());
    				}));
    		}
    	};

    	return [projectFilter, filteredProjects, filterBySkill, click_handler];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$6, safe_not_equal, { projectFilter: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*projectFilter*/ ctx[0] === undefined && !("projectFilter" in props)) {
    			console.warn("<Projects> was created without expected prop 'projectFilter'");
    		}
    	}

    	get projectFilter() {
    		throw new Error("<Projects>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectFilter(value) {
    		throw new Error("<Projects>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Contact.svelte generated by Svelte v3.18.1 */

    const file$6 = "src\\Contact.svelte";

    function create_fragment$7(ctx) {
    	let form;
    	let fieldset;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let label1;
    	let t4;
    	let input1;
    	let t5;
    	let label2;
    	let t7;
    	let textarea;
    	let t8;
    	let input2;
    	let t9;
    	let input3;
    	let form_action_value;

    	const block = {
    		c: function create() {
    			form = element("form");
    			fieldset = element("fieldset");
    			label0 = element("label");
    			label0.textContent = "Full Name";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			label1 = element("label");
    			label1.textContent = "Email Address";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			label2 = element("label");
    			label2.textContent = "Message";
    			t7 = space();
    			textarea = element("textarea");
    			t8 = space();
    			input2 = element("input");
    			t9 = space();
    			input3 = element("input");
    			attr_dev(label0, "for", "full-name");
    			attr_dev(label0, "class", "svelte-pcdyg4");
    			add_location(label0, file$6, 11, 4, 230);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "name");
    			attr_dev(input0, "id", "full-name");
    			attr_dev(input0, "placeholder", "First and Last");
    			input0.required = "";
    			attr_dev(input0, "class", "svelte-pcdyg4");
    			add_location(input0, file$6, 12, 4, 276);
    			attr_dev(label1, "for", "email-address");
    			attr_dev(label1, "class", "svelte-pcdyg4");
    			add_location(label1, file$6, 18, 4, 406);
    			attr_dev(input1, "type", "email");
    			attr_dev(input1, "name", "_replyto");
    			attr_dev(input1, "id", "email-address");
    			attr_dev(input1, "placeholder", "email@domain.tld");
    			input1.required = "";
    			attr_dev(input1, "class", "svelte-pcdyg4");
    			add_location(input1, file$6, 19, 4, 460);
    			attr_dev(label2, "for", "message");
    			attr_dev(label2, "class", "svelte-pcdyg4");
    			add_location(label2, file$6, 25, 4, 601);
    			attr_dev(textarea, "rows", "5");
    			attr_dev(textarea, "name", "message");
    			attr_dev(textarea, "id", "message");
    			attr_dev(textarea, "placeholder", "Aenean lacinia bibendum nulla sed consectetur. Vivamus\r\n      sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec\r\n      ullamcorper nulla non metus auctor fringilla nullam quis risus.");
    			textarea.required = "";
    			attr_dev(textarea, "class", "svelte-pcdyg4");
    			add_location(textarea, file$6, 26, 4, 643);
    			attr_dev(input2, "type", "hidden");
    			attr_dev(input2, "name", "_subject");
    			attr_dev(input2, "id", "email-subject");
    			input2.value = "Contact Form Submission";
    			attr_dev(input2, "class", "svelte-pcdyg4");
    			add_location(input2, file$6, 34, 4, 961);
    			attr_dev(fieldset, "id", "fs-frm-inputs");
    			attr_dev(fieldset, "class", "svelte-pcdyg4");
    			add_location(fieldset, file$6, 10, 2, 195);
    			attr_dev(input3, "type", "submit");
    			input3.value = "Submit";
    			attr_dev(input3, "class", "svelte-pcdyg4");
    			add_location(input3, file$6, 40, 2, 1098);
    			attr_dev(form, "id", "fs-frm");
    			attr_dev(form, "name", "simple-contact-form");
    			attr_dev(form, "accept-charset", "utf-8");
    			attr_dev(form, "action", form_action_value = "https://formspree.io/f/" + /*form_id*/ ctx[0]);
    			attr_dev(form, "method", "post");
    			attr_dev(form, "class", "svelte-pcdyg4");
    			add_location(form, file$6, 4, 0, 52);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, fieldset);
    			append_dev(fieldset, label0);
    			append_dev(fieldset, t1);
    			append_dev(fieldset, input0);
    			append_dev(fieldset, t2);
    			append_dev(fieldset, label1);
    			append_dev(fieldset, t4);
    			append_dev(fieldset, input1);
    			append_dev(fieldset, t5);
    			append_dev(fieldset, label2);
    			append_dev(fieldset, t7);
    			append_dev(fieldset, textarea);
    			append_dev(fieldset, t8);
    			append_dev(fieldset, input2);
    			append_dev(form, t9);
    			append_dev(form, input3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self) {
    	let form_id = "xpzkozvp";

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("form_id" in $$props) $$invalidate(0, form_id = $$props.form_id);
    	};

    	return [form_id];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\pages\Home.svelte generated by Svelte v3.18.1 */
    const file$7 = "src\\pages\\Home.svelte";

    function create_fragment$8(ctx) {
    	let main;
    	let section0;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let section1;
    	let h30;
    	let t5;
    	let t6;
    	let section2;
    	let h31;
    	let t8;
    	let updating_projectFilter;
    	let t9;
    	let section3;
    	let h32;
    	let t11;
    	let updating_projectFilter_1;
    	let t12;
    	let section4;
    	let h33;
    	let t14;
    	let current;
    	const about = new About({ $$inline: true });

    	function proficiencies_projectFilter_binding(value) {
    		/*proficiencies_projectFilter_binding*/ ctx[1].call(null, value);
    	}

    	let proficiencies_props = {};

    	if (/*projectFilter*/ ctx[0] !== void 0) {
    		proficiencies_props.projectFilter = /*projectFilter*/ ctx[0];
    	}

    	const proficiencies = new Proficiencies({
    			props: proficiencies_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(proficiencies, "projectFilter", proficiencies_projectFilter_binding));

    	function projects_projectFilter_binding(value_1) {
    		/*projects_projectFilter_binding*/ ctx[2].call(null, value_1);
    	}

    	let projects_props = {};

    	if (/*projectFilter*/ ctx[0] !== void 0) {
    		projects_props.projectFilter = /*projectFilter*/ ctx[0];
    	}

    	const projects = new Projects({ props: projects_props, $$inline: true });
    	binding_callbacks.push(() => bind(projects, "projectFilter", projects_projectFilter_binding));
    	const contact = new Contact({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			section0 = element("section");
    			h1 = element("h1");
    			h1.textContent = "Christopher Odell";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Data Analytics Management | Data scientist | Data Engineer";
    			t3 = space();
    			section1 = element("section");
    			h30 = element("h3");
    			h30.textContent = "Let me introduce myself!";
    			t5 = space();
    			create_component(about.$$.fragment);
    			t6 = space();
    			section2 = element("section");
    			h31 = element("h3");
    			h31.textContent = "Here are some of my Proficiencies";
    			t8 = space();
    			create_component(proficiencies.$$.fragment);
    			t9 = space();
    			section3 = element("section");
    			h32 = element("h3");
    			h32.textContent = "Here is a glimpse of some of my projects";
    			t11 = space();
    			create_component(projects.$$.fragment);
    			t12 = space();
    			section4 = element("section");
    			h33 = element("h3");
    			h33.textContent = "I would love to connect!";
    			t14 = space();
    			create_component(contact.$$.fragment);
    			attr_dev(h1, "class", "name svelte-1bv9b1k");
    			add_location(h1, file$7, 17, 4, 475);
    			attr_dev(h2, "class", "open svelte-1bv9b1k");
    			add_location(h2, file$7, 18, 4, 520);
    			attr_dev(section0, "class", "start svelte-1bv9b1k");
    			set_style(section0, "background-image", "url(./assets/background.jpg)");
    			attr_dev(section0, "id", "home");
    			add_location(section0, file$7, 13, 2, 303);
    			attr_dev(h30, "class", "svelte-1bv9b1k");
    			add_location(h30, file$7, 24, 4, 675);
    			attr_dev(section1, "class", "about svelte-1bv9b1k");
    			attr_dev(section1, "id", "about");
    			add_location(section1, file$7, 23, 2, 634);
    			attr_dev(h31, "class", "svelte-1bv9b1k");
    			add_location(h31, file$7, 29, 4, 807);
    			attr_dev(section2, "class", "main_section container svelte-1bv9b1k");
    			attr_dev(section2, "id", "proficiencies");
    			add_location(section2, file$7, 28, 2, 742);
    			attr_dev(h32, "class", "svelte-1bv9b1k");
    			add_location(h32, file$7, 35, 4, 968);
    			attr_dev(section3, "class", "projects svelte-1bv9b1k");
    			attr_dev(section3, "id", "projects");
    			add_location(section3, file$7, 34, 2, 922);
    			attr_dev(h33, "class", "svelte-1bv9b1k");
    			add_location(h33, file$7, 39, 4, 1115);
    			attr_dev(section4, "class", "contact svelte-1bv9b1k");
    			attr_dev(section4, "id", "contact");
    			add_location(section4, file$7, 38, 2, 1071);
    			attr_dev(main, "class", "svelte-1bv9b1k");
    			add_location(main, file$7, 12, 0, 293);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section0);
    			append_dev(section0, h1);
    			append_dev(section0, t1);
    			append_dev(section0, h2);
    			append_dev(main, t3);
    			append_dev(main, section1);
    			append_dev(section1, h30);
    			append_dev(section1, t5);
    			mount_component(about, section1, null);
    			append_dev(main, t6);
    			append_dev(main, section2);
    			append_dev(section2, h31);
    			append_dev(section2, t8);
    			mount_component(proficiencies, section2, null);
    			append_dev(main, t9);
    			append_dev(main, section3);
    			append_dev(section3, h32);
    			append_dev(section3, t11);
    			mount_component(projects, section3, null);
    			append_dev(main, t12);
    			append_dev(main, section4);
    			append_dev(section4, h33);
    			append_dev(section4, t14);
    			mount_component(contact, section4, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const proficiencies_changes = {};

    			if (!updating_projectFilter && dirty & /*projectFilter*/ 1) {
    				updating_projectFilter = true;
    				proficiencies_changes.projectFilter = /*projectFilter*/ ctx[0];
    				add_flush_callback(() => updating_projectFilter = false);
    			}

    			proficiencies.$set(proficiencies_changes);
    			const projects_changes = {};

    			if (!updating_projectFilter_1 && dirty & /*projectFilter*/ 1) {
    				updating_projectFilter_1 = true;
    				projects_changes.projectFilter = /*projectFilter*/ ctx[0];
    				add_flush_callback(() => updating_projectFilter_1 = false);
    			}

    			projects.$set(projects_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);
    			transition_in(proficiencies.$$.fragment, local);
    			transition_in(projects.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			transition_out(proficiencies.$$.fragment, local);
    			transition_out(projects.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(about);
    			destroy_component(proficiencies);
    			destroy_component(projects);
    			destroy_component(contact);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let projectFilter = null;

    	function proficiencies_projectFilter_binding(value) {
    		projectFilter = value;
    		$$invalidate(0, projectFilter);
    	}

    	function projects_projectFilter_binding(value_1) {
    		projectFilter = value_1;
    		$$invalidate(0, projectFilter);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("projectFilter" in $$props) $$invalidate(0, projectFilter = $$props.projectFilter);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*projectFilter*/ 1) {
    			 console.log("ProjectFilter", projectFilter);
    		}
    	};

    	return [
    		projectFilter,
    		proficiencies_projectFilter_binding,
    		projects_projectFilter_binding
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.18.1 */

    const { window: window_1$1 } = globals;
    const file$8 = "src\\App.svelte";

    function create_fragment$9(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let div;
    	let a;
    	let current;
    	let dispose;

    	const navigation = new Navigation({
    			props: { baseURL: /*baseURL*/ ctx[3] },
    			$$inline: true
    		});

    	var switch_value = /*page*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*params*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navigation.$$.fragment);
    			t0 = space();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t1 = space();
    			div = element("div");
    			a = element("a");
    			a.textContent = "^";
    			attr_dev(a, "href", "#home");
    			add_location(a, file$8, 66, 4, 1402);
    			attr_dev(div, "class", "back-to-top svelte-1q18gob");
    			add_location(div, file$8, 65, 2, 1371);
    			add_location(main, file$8, 62, 0, 1288);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navigation, main, null);
    			append_dev(main, t0);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			append_dev(main, t1);
    			append_dev(main, div);
    			append_dev(div, a);
    			/*a_binding*/ ctx[7](a);
    			current = true;
    			dispose = listen_dev(window_1$1, "scroll", /*backToTop*/ ctx[4], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*page*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, t1);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigation.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigation.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navigation);
    			if (switch_instance) destroy_component(switch_instance);
    			/*a_binding*/ ctx[7](null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let page$1;
    	let pageInfo = {};
    	let params;
    	let baseURL = window.location.origin;
    	let el;

    	page("/", () => {
    		$$invalidate(0, page$1 = Home);
    		updatePageInfo("home", "/");
    	});

    	// router("/proficiencies", () => {
    	//   console.log("proficiencies PATH");
    	//   page = Proficiencies;
    	//   updatePageInfo("proficiencies","/proficiencies");
    	// });
    	page(
    		"/:projectName",
    		(context, next) => {
    			$$invalidate(1, params = context.params);

    			// updatePageInfo("python","/python");
    			next();
    		},
    		() => $$invalidate(0, page$1 = ProjectTemplate)
    	);

    	page("/*", () => {
    		console.log("my page does not match");
    	});

    	page.start();

    	function updatePageInfo(name, path) {
    		pageInfo = { name, path };
    	}

    	const backToTop = () => {
    		if (window.pageYOffset > 0) {
    			$$invalidate(2, el.style.visibility = "visible", el);
    		} else {
    			$$invalidate(2, el.style.visibility = "hidden", el);
    		}
    	};

    	function a_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, el = $$value);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page$1 = $$props.page);
    		if ("pageInfo" in $$props) pageInfo = $$props.pageInfo;
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("baseURL" in $$props) $$invalidate(3, baseURL = $$props.baseURL);
    		if ("el" in $$props) $$invalidate(2, el = $$props.el);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*page*/ 1) {
    			 console.log("Page", page$1);
    		}
    	};

    	return [page$1, params, el, baseURL, backToTop, pageInfo, updatePageInfo, a_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	intro: true
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
