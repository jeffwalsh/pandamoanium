
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* ../../node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.38.2 */

    const { Error: Error_1, Object: Object_1, console: console_1$1 } = globals;

    // (251:0) {:else}
    function create_else_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		const newState = { ...history.state };
    		delete newState["__svelte_spa_router_scrollX"];
    		delete newState["__svelte_spa_router_scrollY"];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute("href");

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == "/") {
    		// Add # to the href attribute
    		href = "#" + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != "#/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	node.setAttribute("href", href);

    	node.addEventListener("click", event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute("href"));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == "string") {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener("popstate", popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == "object" && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener("popstate", popStateChanged);
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("popStateChanged" in $$props) popStateChanged = $$props.popStateChanged;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z$1 = "main.svelte-1ggq3y7.svelte-1ggq3y7{text-align:center;margin:0 auto;width:100%;height:100%;display:grid;grid-template-rows:61% 39%;box-sizing:border-box}main.svelte-1ggq3y7 div.svelte-1ggq3y7{align-items:center;box-sizing:border-box;width:100%;height:100%}main.svelte-1ggq3y7 div.title.svelte-1ggq3y7{display:flex;flex-direction:column;justify-content:center}main.svelte-1ggq3y7 div .inner.svelte-1ggq3y7{display:inline-block;box-sizing:border-box}h1.svelte-1ggq3y7.svelte-1ggq3y7{color:#ff3e00;text-transform:uppercase;font-size:4em;font-weight:100;border:1px solid #bdb954;-webkit-animation:svelte-1ggq3y7-border-glow 3s infinite;animation:svelte-1ggq3y7-border-glow 3s infinite}h2.svelte-1ggq3y7.svelte-1ggq3y7{color:#815041;font-style:italic}input.svelte-1ggq3y7.svelte-1ggq3y7,button.svelte-1ggq3y7.svelte-1ggq3y7{font-size:1.25rem;height:50px}input.svelte-1ggq3y7.svelte-1ggq3y7::-moz-placeholder, button.svelte-1ggq3y7.svelte-1ggq3y7::-moz-placeholder{color:#bdb954;opacity:1}input.svelte-1ggq3y7.svelte-1ggq3y7:-ms-input-placeholder, button.svelte-1ggq3y7.svelte-1ggq3y7:-ms-input-placeholder{color:#bdb954;opacity:1}input.svelte-1ggq3y7.svelte-1ggq3y7::placeholder,button.svelte-1ggq3y7.svelte-1ggq3y7::placeholder{color:#bdb954;opacity:1}input.svelte-1ggq3y7.svelte-1ggq3y7{background-color:#211010;color:#fcf652}button.svelte-1ggq3y7.svelte-1ggq3y7{border-radius:5px;background:radial-gradient(#554800, #1d0000);color:#fcf652}bloodblaze.svelte-1ggq3y7.svelte-1ggq3y7{z-index:-1;position:absolute;top:0;left:0;width:100%;height:100%;opacity:1;background:linear-gradient(135deg, #430000, #cc0058d0, #430000);box-sizing:border-box;background-size:120% 120%;-webkit-animation:svelte-1ggq3y7-GradientSwirl 5s ease infinite, svelte-1ggq3y7-GradientSwirl2 8s linear infinite;animation:svelte-1ggq3y7-GradientSwirl 5s ease infinite, svelte-1ggq3y7-GradientSwirl2 8s linear infinite}@-webkit-keyframes svelte-1ggq3y7-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes svelte-1ggq3y7-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@-webkit-keyframes svelte-1ggq3y7-GradientSwirl{0%{opacity:0.9}50%{opacity:1}100%{opacity:0.9}}@keyframes svelte-1ggq3y7-GradientSwirl{0%{opacity:0.9}50%{opacity:1}100%{opacity:0.9}}@-webkit-keyframes svelte-1ggq3y7-GradientSwirl2{0%{background-position:15% 0%}50%{background-position:86% 100%}100%{background-position:15% 0%}}@keyframes svelte-1ggq3y7-GradientSwirl2{0%{background-position:15% 0%}50%{background-position:86% 100%}100%{background-position:15% 0%}}@-webkit-keyframes svelte-1ggq3y7-border-glow{0%{border:1px solid #bdb954}50%{border:1px solid rgba(189, 185, 84, 0.5)}100%{border:1px solid #bdb954}}@keyframes svelte-1ggq3y7-border-glow{0%{border:1px solid #bdb954}50%{border:1px solid rgba(189, 185, 84, 0.5)}100%{border:1px solid #bdb954}}@media(min-width: 640px){main.svelte-1ggq3y7.svelte-1ggq3y7{max-width:none}}";
    styleInject(css_248z$1);

    /* src/Nomination.svelte generated by Svelte v3.38.2 */

    const file$1 = "src/Nomination.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let h2;
    	let t4;
    	let div1;
    	let span1;
    	let form;
    	let input;
    	let t5;
    	let button;
    	let t7;
    	let span0;
    	let t8;
    	let bloodblaze;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = space();
    			h2 = element("h2");
    			h2.textContent = "Get ready for the ultimate multiplayer interactive experience!";
    			t4 = space();
    			div1 = element("div");
    			span1 = element("span");
    			form = element("form");
    			input = element("input");
    			t5 = space();
    			button = element("button");
    			button.textContent = "GO";
    			t7 = space();
    			span0 = element("span");
    			t8 = space();
    			bloodblaze = element("bloodblaze");
    			attr_dev(h1, "class", "svelte-1ggq3y7");
    			add_location(h1, file$1, 20, 2, 441);
    			attr_dev(h2, "class", "svelte-1ggq3y7");
    			add_location(h2, file$1, 21, 2, 467);
    			attr_dev(div0, "class", "title svelte-1ggq3y7");
    			add_location(div0, file$1, 19, 1, 419);
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "placeholder", "Enter your name");
    			attr_dev(input, "pattern", "[A-Za-z0-9 _]*");
    			attr_dev(input, "class", "svelte-1ggq3y7");
    			add_location(input, file$1, 26, 4, 643);
    			attr_dev(button, "class", "svelte-1ggq3y7");
    			add_location(button, file$1, 29, 4, 769);
    			attr_dev(form, "type", "text");
    			attr_dev(form, "action", "");
    			add_location(form, file$1, 25, 3, 582);
    			add_location(span0, file$1, 31, 2, 804);
    			attr_dev(span1, "class", "inner svelte-1ggq3y7");
    			add_location(span1, file$1, 24, 2, 558);
    			attr_dev(div1, "class", "svelte-1ggq3y7");
    			add_location(div1, file$1, 23, 1, 550);
    			attr_dev(bloodblaze, "class", "svelte-1ggq3y7");
    			add_location(bloodblaze, file$1, 33, 1, 821);
    			attr_dev(main, "class", "svelte-1ggq3y7");
    			add_location(main, file$1, 18, 0, 411);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(div0, t2);
    			append_dev(div0, h2);
    			append_dev(main, t4);
    			append_dev(main, div1);
    			append_dev(div1, span1);
    			append_dev(span1, form);
    			append_dev(form, input);
    			append_dev(form, t5);
    			append_dev(form, button);
    			append_dev(span1, t7);
    			append_dev(span1, span0);
    			append_dev(main, t8);
    			append_dev(main, bloodblaze);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keypress", sanitizeText, false, false, false),
    					listen_dev(form, "submit", /*sendChatMessage*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
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

    function sanitizeText(event) {
    	setTimeout(() => event.target.value = event.target.value.replace(/[^A-Za-z0-9 _]/g, ""));
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nomination", slots, []);
    	let { name } = $$props;
    	const socket = io();

    	function sendChatMessage(e) {
    		e.preventDefault();
    		const input = e.target.children[0];

    		if (input.value) {
    			socket.emit("nomination", input.value);
    			input.value = "";
    		}
    	}

    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nomination> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		socket,
    		sendChatMessage,
    		sanitizeText
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, sendChatMessage];
    }

    class Nomination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nomination",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Nomination> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Nomination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Nomination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const currentAddress = writable("");

    /* src/pages/Connect.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file = "src/pages/Connect.svelte";

    // (22:0) {:else}
    function create_else_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Connect";
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file, 22, 2, 1100);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(22:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:0) {#if $currentAddress}
    function create_if_block(ctx) {
    	let span;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Address: ");
    			t1 = text(/*$currentAddress*/ ctx[0]);
    			attr_dev(span, "class", "hidden");
    			add_location(span, file, 20, 2, 1034);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$currentAddress*/ 1) set_data_dev(t1, /*$currentAddress*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(20:0) {#if $currentAddress}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*$currentAddress*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let $currentAddress;
    	validate_store(currentAddress, "currentAddress");
    	component_subscribe($$self, currentAddress, $$value => $$invalidate(0, $currentAddress = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Connect", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	function connect() {
    		return __awaiter(this, void 0, void 0, function* () {
    			const res = yield window.solana.connect();
    			console.log(res.publicKey.toString());
    			currentAddress.set(res.publicKey.toString());
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Connect> was created with unknown prop '${key}'`);
    	});

    	const click_handler = async () => await connect();

    	$$self.$capture_state = () => ({
    		__awaiter,
    		currentAddress,
    		connect,
    		$currentAddress
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$currentAddress, connect, click_handler];
    }

    class Connect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Connect",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var css_248z = "/*\n! tailwindcss v3.0.23 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: '';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n*/\n\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user's configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\n\ninput::-moz-placeholder, textarea::-moz-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput:-ms-input-placeholder, textarea:-ms-input-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n/*\nEnsure the default browser behavior of the `hidden` attribute.\n*/\n\n[hidden] {\n  display: none;\n}\n\n:root,\n[data-theme] {\n  background-color: hsla(var(--b1) / var(--tw-bg-opacity, 1));\n  color: hsla(var(--bc) / var(--tw-text-opacity, 1));\n}\n\nhtml {\n  -webkit-tap-highlight-color: transparent;\n}\n\n:root {\n  --p: 259 94% 51%;\n  --pf: 259 94% 41%;\n  --sf: 314 100% 38%;\n  --af: 174 60% 41%;\n  --nf: 219 14% 22%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --pc: 0 0% 100%;\n  --s: 314 100% 47%;\n  --sc: 0 0% 100%;\n  --a: 174 60% 51%;\n  --ac: 175 44% 15%;\n  --n: 219 14% 28%;\n  --nc: 0 0% 100%;\n  --b1: 0 0% 100%;\n  --b2: 0 0% 95%;\n  --b3: 180 2% 90%;\n  --bc: 215 28% 17%;\n}\n\n@media (prefers-color-scheme: dark) {\n\n  :root {\n    --p: 262 80% 50%;\n    --pf: 262 80% 40%;\n    --sf: 316 70% 40%;\n    --af: 175 70% 33%;\n    --in: 198 93% 60%;\n    --su: 158 64% 52%;\n    --wa: 43 96% 56%;\n    --er: 0 91% 71%;\n    --inc: 198 100% 12%;\n    --suc: 158 100% 10%;\n    --wac: 43 100% 11%;\n    --erc: 0 100% 14%;\n    --rounded-box: 1rem;\n    --rounded-btn: 0.5rem;\n    --rounded-badge: 1.9rem;\n    --animation-btn: 0.25s;\n    --animation-input: .2s;\n    --btn-text-case: uppercase;\n    --btn-focus-scale: 0.95;\n    --border-btn: 1px;\n    --tab-border: 1px;\n    --tab-radius: 0.5rem;\n    --pc: 0 0% 100%;\n    --s: 316 70% 50%;\n    --sc: 0 0% 100%;\n    --a: 175 70% 41%;\n    --ac: 0 0% 100%;\n    --n: 218 18% 12%;\n    --nf: 223 17% 8%;\n    --nc: 220 13% 69%;\n    --b1: 220 18% 20%;\n    --b2: 220 17% 17%;\n    --b3: 219 18% 15%;\n    --bc: 220 13% 69%;\n  }\n}\n\n[data-theme=light] {\n  --p: 259 94% 51%;\n  --pf: 259 94% 41%;\n  --sf: 314 100% 38%;\n  --af: 174 60% 41%;\n  --nf: 219 14% 22%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --pc: 0 0% 100%;\n  --s: 314 100% 47%;\n  --sc: 0 0% 100%;\n  --a: 174 60% 51%;\n  --ac: 175 44% 15%;\n  --n: 219 14% 28%;\n  --nc: 0 0% 100%;\n  --b1: 0 0% 100%;\n  --b2: 0 0% 95%;\n  --b3: 180 2% 90%;\n  --bc: 215 28% 17%;\n}\n\n[data-theme=dark] {\n  --p: 262 80% 50%;\n  --pf: 262 80% 40%;\n  --sf: 316 70% 40%;\n  --af: 175 70% 33%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --pc: 0 0% 100%;\n  --s: 316 70% 50%;\n  --sc: 0 0% 100%;\n  --a: 175 70% 41%;\n  --ac: 0 0% 100%;\n  --n: 218 18% 12%;\n  --nf: 223 17% 8%;\n  --nc: 220 13% 69%;\n  --b1: 220 18% 20%;\n  --b2: 220 17% 17%;\n  --b3: 219 18% 15%;\n  --bc: 220 13% 69%;\n}\n\n[data-theme=cupcake] {\n  --p: 183 47% 59%;\n  --pf: 183 47% 47%;\n  --sf: 338 71% 62%;\n  --af: 39 84% 46%;\n  --nf: 280 46% 11%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --pc: 183 100% 12%;\n  --sc: 338 100% 16%;\n  --ac: 39 100% 12%;\n  --nc: 280 83% 83%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --s: 338 71% 78%;\n  --a: 39 84% 58%;\n  --n: 280 46% 14%;\n  --b1: 24 33% 97%;\n  --b2: 27 22% 92%;\n  --b3: 22 14% 89%;\n  --bc: 280 46% 14%;\n  --rounded-btn: 1.9rem;\n  --tab-border: 2px;\n  --tab-radius: .5rem;\n}\n\n[data-theme=bumblebee] {\n  --p: 41 74% 53%;\n  --pf: 41 74% 42%;\n  --sf: 50 94% 46%;\n  --af: 240 33% 11%;\n  --nf: 240 33% 11%;\n  --b2: 0 0% 90%;\n  --b3: 0 0% 81%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --bc: 0 0% 20%;\n  --ac: 240 60% 83%;\n  --nc: 240 60% 83%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --pc: 240 33% 14%;\n  --s: 50 94% 58%;\n  --sc: 240 33% 14%;\n  --a: 240 33% 14%;\n  --n: 240 33% 14%;\n  --b1: 0 0% 100%;\n}\n\n[data-theme=emerald] {\n  --p: 141 50% 60%;\n  --pf: 141 50% 48%;\n  --sf: 219 96% 48%;\n  --af: 10 81% 45%;\n  --nf: 219 20% 20%;\n  --b2: 0 0% 90%;\n  --b3: 0 0% 81%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --btn-text-case: uppercase;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --pc: 151 28% 19%;\n  --s: 219 96% 60%;\n  --sc: 210 20% 98%;\n  --a: 10 81% 56%;\n  --ac: 210 20% 98%;\n  --n: 219 20% 25%;\n  --nc: 210 20% 98%;\n  --b1: 0 0% 100%;\n  --bc: 219 20% 25%;\n  --animation-btn: 0;\n  --animation-input: 0;\n  --btn-focus-scale: 1;\n}\n\n[data-theme=corporate] {\n  --p: 229 96% 64%;\n  --pf: 229 96% 51%;\n  --sf: 215 26% 47%;\n  --af: 154 49% 48%;\n  --nf: 233 27% 10%;\n  --b2: 0 0% 90%;\n  --b3: 0 0% 81%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --pc: 229 100% 93%;\n  --sc: 215 100% 12%;\n  --ac: 154 100% 12%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --btn-text-case: uppercase;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 215 26% 59%;\n  --a: 154 49% 60%;\n  --n: 233 27% 13%;\n  --nc: 210 38% 95%;\n  --b1: 0 0% 100%;\n  --bc: 233 27% 13%;\n  --rounded-box: 0.25rem;\n  --rounded-btn: .125rem;\n  --rounded-badge: .125rem;\n  --animation-btn: 0;\n  --animation-input: 0;\n  --btn-focus-scale: 1;\n}\n\n[data-theme=synthwave] {\n  --p: 321 70% 69%;\n  --pf: 321 70% 55%;\n  --sf: 197 87% 52%;\n  --af: 48 89% 46%;\n  --nf: 253 61% 15%;\n  --b2: 254 59% 23%;\n  --b3: 254 59% 21%;\n  --pc: 321 100% 14%;\n  --sc: 197 100% 13%;\n  --ac: 48 100% 11%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 197 87% 65%;\n  --a: 48 89% 57%;\n  --n: 253 61% 19%;\n  --nc: 260 60% 98%;\n  --b1: 254 59% 26%;\n  --bc: 260 60% 98%;\n  --in: 199 87% 64%;\n  --inc: 257 63% 17%;\n  --su: 168 74% 68%;\n  --suc: 257 63% 17%;\n  --wa: 48 89% 57%;\n  --wac: 257 63% 17%;\n  --er: 352 74% 57%;\n  --erc: 260 60% 98%;\n}\n\n[data-theme=retro] {\n  --p: 3 74% 76%;\n  --pf: 3 74% 61%;\n  --sf: 145 27% 58%;\n  --af: 49 67% 61%;\n  --nf: 42 17% 34%;\n  --inc: 221 100% 91%;\n  --suc: 142 100% 87%;\n  --wac: 32 100% 9%;\n  --erc: 0 100% 90%;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --pc: 345 5% 15%;\n  --s: 145 27% 72%;\n  --sc: 345 5% 15%;\n  --a: 49 67% 76%;\n  --ac: 345 5% 15%;\n  --n: 42 17% 42%;\n  --nc: 45 47% 80%;\n  --b1: 45 47% 80%;\n  --b2: 45 37% 72%;\n  --b3: 42 36% 65%;\n  --bc: 345 5% 15%;\n  --in: 221 83% 53%;\n  --su: 142 76% 36%;\n  --wa: 32 95% 44%;\n  --er: 0 72% 51%;\n  --rounded-box: 0.4rem;\n  --rounded-btn: 0.4rem;\n  --rounded-badge: 0.4rem;\n}\n\n[data-theme=cyberpunk] {\n  font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;\n  --pf: 345 100% 58%;\n  --sf: 195 80% 56%;\n  --af: 276 74% 57%;\n  --nf: 57 100% 10%;\n  --b2: 56 100% 45%;\n  --b3: 56 100% 41%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --bc: 56 100% 10%;\n  --pc: 345 100% 15%;\n  --sc: 195 100% 14%;\n  --ac: 276 100% 14%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --p: 345 100% 73%;\n  --s: 195 80% 70%;\n  --a: 276 74% 71%;\n  --n: 57 100% 13%;\n  --nc: 56 100% 50%;\n  --b1: 56 100% 50%;\n  --rounded-box: 0;\n  --rounded-btn: 0;\n  --rounded-badge: 0;\n  --tab-radius: 0;\n}\n\n[data-theme=valentine] {\n  --p: 353 74% 67%;\n  --pf: 353 74% 54%;\n  --sf: 254 86% 61%;\n  --af: 181 56% 56%;\n  --nf: 336 43% 38%;\n  --b2: 318 46% 80%;\n  --b3: 318 46% 72%;\n  --pc: 353 100% 13%;\n  --sc: 254 100% 15%;\n  --ac: 181 100% 14%;\n  --inc: 221 100% 91%;\n  --suc: 142 100% 87%;\n  --wac: 32 100% 9%;\n  --erc: 0 100% 90%;\n  --rounded-box: 1rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 254 86% 77%;\n  --a: 181 56% 70%;\n  --n: 336 43% 48%;\n  --nc: 318 46% 89%;\n  --b1: 318 46% 89%;\n  --bc: 344 38% 28%;\n  --in: 221 83% 53%;\n  --su: 142 76% 36%;\n  --wa: 32 95% 44%;\n  --er: 0 72% 51%;\n  --rounded-btn: 1.9rem;\n}\n\n[data-theme=halloween] {\n  --p: 32 89% 52%;\n  --pf: 32 89% 42%;\n  --sf: 271 46% 34%;\n  --af: 91 100% 26%;\n  --nf: 180 4% 9%;\n  --b2: 0 0% 12%;\n  --b3: 0 0% 10%;\n  --bc: 0 0% 83%;\n  --sc: 271 100% 88%;\n  --ac: 91 100% 87%;\n  --nc: 180 5% 82%;\n  --inc: 221 100% 91%;\n  --suc: 142 100% 87%;\n  --wac: 32 100% 9%;\n  --erc: 0 100% 90%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --pc: 180 7% 8%;\n  --s: 271 46% 42%;\n  --a: 91 100% 33%;\n  --n: 180 4% 11%;\n  --b1: 0 0% 13%;\n  --in: 221 83% 53%;\n  --su: 142 76% 36%;\n  --wa: 32 95% 44%;\n  --er: 0 72% 51%;\n}\n\n[data-theme=garden] {\n  --p: 139 16% 43%;\n  --pf: 139 16% 34%;\n  --sf: 97 37% 75%;\n  --af: 0 68% 75%;\n  --nf: 0 4% 28%;\n  --b2: 0 4% 82%;\n  --b3: 0 4% 74%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --pc: 139 100% 89%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 97 37% 93%;\n  --sc: 96 32% 15%;\n  --a: 0 68% 94%;\n  --ac: 0 22% 16%;\n  --n: 0 4% 35%;\n  --nc: 0 4% 91%;\n  --b1: 0 4% 91%;\n  --bc: 0 3% 6%;\n}\n\n[data-theme=forest] {\n  --p: 141 72% 42%;\n  --pf: 141 72% 34%;\n  --sf: 141 75% 38%;\n  --af: 35 69% 42%;\n  --nf: 0 10% 5%;\n  --b2: 0 12% 7%;\n  --b3: 0 12% 7%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --bc: 0 12% 82%;\n  --pc: 141 100% 88%;\n  --sc: 141 100% 10%;\n  --ac: 35 100% 10%;\n  --nc: 0 7% 81%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 141 75% 48%;\n  --a: 35 69% 52%;\n  --n: 0 10% 6%;\n  --b1: 0 12% 8%;\n  --rounded-btn: 1.9rem;\n}\n\n[data-theme=aqua] {\n  --p: 182 93% 49%;\n  --pf: 182 93% 40%;\n  --sf: 274 31% 45%;\n  --af: 47 100% 64%;\n  --nf: 205 54% 40%;\n  --b2: 219 53% 39%;\n  --b3: 219 53% 35%;\n  --bc: 219 100% 89%;\n  --sc: 274 100% 11%;\n  --ac: 47 100% 16%;\n  --nc: 205 100% 90%;\n  --inc: 221 100% 91%;\n  --suc: 142 100% 87%;\n  --wac: 32 100% 9%;\n  --erc: 0 100% 90%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --pc: 181 100% 17%;\n  --s: 274 31% 57%;\n  --a: 47 100% 80%;\n  --n: 205 54% 50%;\n  --b1: 219 53% 43%;\n  --in: 221 83% 53%;\n  --su: 142 76% 36%;\n  --wa: 32 95% 44%;\n  --er: 0 72% 51%;\n}\n\n[data-theme=lofi] {\n  --p: 0 0% 5%;\n  --pf: 0 0% 4%;\n  --sf: 0 2% 8%;\n  --af: 0 0% 12%;\n  --nf: 0 0% 0%;\n  --btn-text-case: uppercase;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --pc: 0 0% 100%;\n  --s: 0 2% 10%;\n  --sc: 0 0% 100%;\n  --a: 0 0% 15%;\n  --ac: 0 0% 100%;\n  --n: 0 0% 0%;\n  --nc: 0 0% 100%;\n  --b1: 0 0% 100%;\n  --b2: 0 0% 95%;\n  --b3: 0 2% 90%;\n  --bc: 0 0% 0%;\n  --in: 212 100% 48%;\n  --inc: 0 0% 100%;\n  --su: 137 72% 46%;\n  --suc: 0 0% 100%;\n  --wa: 5 100% 66%;\n  --wac: 0 0% 100%;\n  --er: 325 78% 49%;\n  --erc: 0 0% 100%;\n  --rounded-box: 0.25rem;\n  --rounded-btn: 0.125rem;\n  --rounded-badge: 0.125rem;\n  --animation-btn: 0;\n  --animation-input: 0;\n  --btn-focus-scale: 1;\n  --tab-radius: 0;\n}\n\n[data-theme=pastel] {\n  --p: 284 22% 80%;\n  --pf: 284 22% 64%;\n  --sf: 352 70% 70%;\n  --af: 158 55% 65%;\n  --nf: 199 44% 49%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --bc: 0 0% 20%;\n  --pc: 284 59% 16%;\n  --sc: 352 100% 18%;\n  --ac: 158 100% 16%;\n  --nc: 199 100% 12%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 352 70% 88%;\n  --a: 158 55% 81%;\n  --n: 199 44% 61%;\n  --b1: 0 0% 100%;\n  --b2: 210 20% 98%;\n  --b3: 216 12% 84%;\n  --rounded-btn: 1.9rem;\n}\n\n[data-theme=fantasy] {\n  --p: 296 83% 25%;\n  --pf: 296 83% 20%;\n  --sf: 200 100% 30%;\n  --af: 31 94% 41%;\n  --nf: 215 28% 13%;\n  --b2: 0 0% 90%;\n  --b3: 0 0% 81%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --pc: 296 100% 85%;\n  --sc: 200 100% 87%;\n  --ac: 31 100% 10%;\n  --nc: 215 62% 83%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 200 100% 37%;\n  --a: 31 94% 51%;\n  --n: 215 28% 17%;\n  --b1: 0 0% 100%;\n  --bc: 215 28% 17%;\n}\n\n[data-theme=wireframe] {\n  font-family: Chalkboard,comic sans ms,\"sanssecondaryerif\";\n  --pf: 0 0% 58%;\n  --sf: 0 0% 58%;\n  --af: 0 0% 58%;\n  --nf: 0 0% 74%;\n  --bc: 0 0% 20%;\n  --pc: 0 0% 14%;\n  --sc: 0 0% 14%;\n  --ac: 0 0% 14%;\n  --nc: 0 0% 18%;\n  --inc: 240 100% 90%;\n  --suc: 120 100% 85%;\n  --wac: 60 100% 10%;\n  --erc: 0 100% 90%;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --p: 0 0% 72%;\n  --s: 0 0% 72%;\n  --a: 0 0% 72%;\n  --n: 0 0% 92%;\n  --b1: 0 0% 100%;\n  --b2: 0 0% 93%;\n  --b3: 0 0% 87%;\n  --in: 240 100% 50%;\n  --su: 120 100% 25%;\n  --wa: 60 30% 50%;\n  --er: 0 100% 50%;\n  --rounded-box: 0.2rem;\n  --rounded-btn: 0.2rem;\n  --rounded-badge: 0.2rem;\n  --tab-radius: 0.2rem;\n}\n\n[data-theme=black] {\n  --p: 0 2% 20%;\n  --pf: 0 2% 16%;\n  --sf: 0 2% 16%;\n  --af: 0 2% 16%;\n  --bc: 0 0% 80%;\n  --pc: 0 5% 84%;\n  --sc: 0 5% 84%;\n  --ac: 0 5% 84%;\n  --nc: 0 3% 83%;\n  --inc: 240 100% 90%;\n  --suc: 120 100% 85%;\n  --wac: 60 100% 10%;\n  --erc: 0 100% 90%;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --s: 0 2% 20%;\n  --a: 0 2% 20%;\n  --b1: 0 0% 0%;\n  --b2: 0 0% 5%;\n  --b3: 0 2% 10%;\n  --n: 0 1% 15%;\n  --nf: 0 2% 20%;\n  --in: 240 100% 50%;\n  --su: 120 100% 25%;\n  --wa: 60 100% 50%;\n  --er: 0 100% 50%;\n  --rounded-box: 0;\n  --rounded-btn: 0;\n  --rounded-badge: 0;\n  --animation-btn: 0;\n  --animation-input: 0;\n  --btn-text-case: lowercase;\n  --btn-focus-scale: 1;\n  --tab-radius: 0;\n}\n\n[data-theme=luxury] {\n  --p: 0 0% 100%;\n  --pf: 0 0% 80%;\n  --sf: 218 54% 14%;\n  --af: 319 22% 21%;\n  --nf: 270 4% 7%;\n  --pc: 0 0% 20%;\n  --sc: 218 100% 84%;\n  --ac: 319 85% 85%;\n  --inc: 202 100% 14%;\n  --suc: 89 100% 10%;\n  --wac: 54 100% 13%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 218 54% 18%;\n  --a: 319 22% 26%;\n  --n: 270 4% 9%;\n  --nc: 37 67% 58%;\n  --b1: 240 10% 4%;\n  --b2: 270 4% 9%;\n  --b3: 270 2% 18%;\n  --bc: 37 67% 58%;\n  --in: 202 100% 70%;\n  --su: 89 62% 52%;\n  --wa: 54 69% 64%;\n  --er: 0 100% 72%;\n}\n\n[data-theme=dracula] {\n  --p: 326 100% 74%;\n  --pf: 326 100% 59%;\n  --sf: 265 89% 62%;\n  --af: 31 100% 57%;\n  --nf: 230 15% 24%;\n  --b2: 231 15% 17%;\n  --b3: 231 15% 15%;\n  --pc: 326 100% 15%;\n  --sc: 265 100% 16%;\n  --ac: 31 100% 14%;\n  --nc: 230 71% 86%;\n  --inc: 191 100% 15%;\n  --suc: 135 100% 13%;\n  --wac: 65 100% 15%;\n  --erc: 0 100% 13%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 265 89% 78%;\n  --a: 31 100% 71%;\n  --n: 230 15% 30%;\n  --b1: 231 15% 18%;\n  --bc: 60 30% 96%;\n  --in: 191 97% 77%;\n  --su: 135 94% 65%;\n  --wa: 65 92% 76%;\n  --er: 0 100% 67%;\n}\n\n[data-theme=cmyk] {\n  --p: 203 83% 60%;\n  --pf: 203 83% 48%;\n  --sf: 335 78% 48%;\n  --af: 56 100% 48%;\n  --nf: 0 0% 8%;\n  --b2: 0 0% 90%;\n  --b3: 0 0% 81%;\n  --bc: 0 0% 20%;\n  --pc: 203 100% 12%;\n  --sc: 335 100% 92%;\n  --ac: 56 100% 12%;\n  --nc: 0 0% 82%;\n  --inc: 192 100% 10%;\n  --suc: 291 100% 88%;\n  --wac: 25 100% 11%;\n  --erc: 4 100% 91%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 335 78% 60%;\n  --a: 56 100% 60%;\n  --n: 0 0% 10%;\n  --b1: 0 0% 100%;\n  --in: 192 48% 52%;\n  --su: 291 48% 38%;\n  --wa: 25 85% 57%;\n  --er: 4 81% 56%;\n}\n\n[data-theme=autumn] {\n  --p: 344 96% 28%;\n  --pf: 344 96% 22%;\n  --sf: 0 63% 47%;\n  --af: 27 56% 50%;\n  --nf: 22 17% 35%;\n  --b2: 0 0% 85%;\n  --b3: 0 0% 77%;\n  --bc: 0 0% 19%;\n  --pc: 344 100% 86%;\n  --sc: 0 100% 92%;\n  --ac: 27 100% 13%;\n  --nc: 22 100% 89%;\n  --inc: 187 100% 10%;\n  --suc: 165 100% 89%;\n  --wac: 30 100% 10%;\n  --erc: 354 100% 90%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 0 63% 58%;\n  --a: 27 56% 63%;\n  --n: 22 17% 44%;\n  --b1: 0 0% 95%;\n  --in: 187 48% 50%;\n  --su: 165 34% 43%;\n  --wa: 30 84% 50%;\n  --er: 354 79% 49%;\n}\n\n[data-theme=business] {\n  --p: 210 64% 31%;\n  --pf: 210 64% 24%;\n  --sf: 200 13% 44%;\n  --af: 13 80% 48%;\n  --nf: 213 14% 13%;\n  --b2: 0 0% 11%;\n  --b3: 0 0% 10%;\n  --bc: 0 0% 83%;\n  --pc: 210 100% 86%;\n  --sc: 200 100% 11%;\n  --ac: 13 100% 12%;\n  --nc: 213 28% 83%;\n  --inc: 199 100% 88%;\n  --suc: 144 100% 11%;\n  --wac: 39 100% 12%;\n  --erc: 6 100% 89%;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 200 13% 55%;\n  --a: 13 80% 60%;\n  --n: 213 14% 16%;\n  --b1: 0 0% 13%;\n  --in: 199 100% 42%;\n  --su: 144 31% 56%;\n  --wa: 39 64% 60%;\n  --er: 6 56% 43%;\n  --rounded-box: 0.25rem;\n  --rounded-btn: .125rem;\n  --rounded-badge: .125rem;\n}\n\n[data-theme=acid] {\n  --p: 303 100% 50%;\n  --pf: 303 100% 40%;\n  --sf: 27 100% 40%;\n  --af: 72 98% 40%;\n  --nf: 238 43% 14%;\n  --b2: 0 0% 88%;\n  --b3: 0 0% 79%;\n  --bc: 0 0% 20%;\n  --pc: 303 100% 90%;\n  --sc: 27 100% 10%;\n  --ac: 72 100% 10%;\n  --nc: 238 99% 83%;\n  --inc: 210 100% 12%;\n  --suc: 149 100% 12%;\n  --wac: 53 100% 11%;\n  --erc: 1 100% 89%;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 27 100% 50%;\n  --a: 72 98% 50%;\n  --n: 238 43% 17%;\n  --b1: 0 0% 98%;\n  --in: 210 92% 58%;\n  --su: 149 50% 58%;\n  --wa: 53 93% 57%;\n  --er: 1 100% 45%;\n  --rounded-box: 1.25rem;\n  --rounded-btn: 1rem;\n  --rounded-badge: 1rem;\n}\n\n[data-theme=lemonade] {\n  --p: 89 96% 31%;\n  --pf: 89 96% 24%;\n  --sf: 60 81% 44%;\n  --af: 63 80% 71%;\n  --nf: 238 43% 14%;\n  --b2: 0 0% 90%;\n  --b3: 0 0% 81%;\n  --bc: 0 0% 20%;\n  --pc: 89 100% 86%;\n  --sc: 60 100% 11%;\n  --ac: 63 100% 18%;\n  --nc: 238 99% 83%;\n  --inc: 192 79% 17%;\n  --suc: 74 100% 16%;\n  --wac: 50 100% 15%;\n  --erc: 1 100% 17%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 60 81% 55%;\n  --a: 63 80% 88%;\n  --n: 238 43% 17%;\n  --b1: 0 0% 100%;\n  --in: 192 39% 85%;\n  --su: 74 76% 79%;\n  --wa: 50 87% 75%;\n  --er: 1 70% 83%;\n}\n\n[data-theme=night] {\n  --p: 198 93% 60%;\n  --pf: 198 93% 48%;\n  --sf: 234 89% 59%;\n  --af: 329 86% 56%;\n  --b2: 222 47% 10%;\n  --b3: 222 47% 9%;\n  --bc: 222 66% 82%;\n  --pc: 198 100% 12%;\n  --sc: 234 100% 15%;\n  --ac: 329 100% 14%;\n  --nc: 217 76% 83%;\n  --inc: 198 100% 90%;\n  --suc: 172 100% 10%;\n  --wac: 41 100% 13%;\n  --erc: 351 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 234 89% 74%;\n  --a: 329 86% 70%;\n  --n: 217 33% 17%;\n  --nf: 217 30% 22%;\n  --b1: 222 47% 11%;\n  --in: 198 90% 48%;\n  --su: 172 66% 50%;\n  --wa: 41 88% 64%;\n  --er: 351 95% 71%;\n}\n\n[data-theme=coffee] {\n  --p: 30 67% 58%;\n  --pf: 30 67% 46%;\n  --sf: 182 25% 16%;\n  --af: 194 74% 20%;\n  --nf: 300 20% 5%;\n  --b2: 306 19% 10%;\n  --b3: 306 19% 9%;\n  --pc: 30 100% 12%;\n  --sc: 182 67% 84%;\n  --ac: 194 100% 85%;\n  --nc: 300 14% 81%;\n  --inc: 171 100% 13%;\n  --suc: 93 100% 12%;\n  --wac: 43 100% 14%;\n  --erc: 10 100% 15%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 182 25% 20%;\n  --a: 194 74% 25%;\n  --n: 300 20% 6%;\n  --b1: 306 19% 11%;\n  --bc: 37 8% 42%;\n  --in: 171 37% 67%;\n  --su: 93 25% 62%;\n  --wa: 43 100% 69%;\n  --er: 10 95% 75%;\n}\n\n[data-theme=winter] {\n  --p: 212 100% 51%;\n  --pf: 212 100% 41%;\n  --sf: 247 47% 35%;\n  --af: 310 49% 42%;\n  --nf: 217 92% 8%;\n  --pc: 212 100% 90%;\n  --sc: 247 100% 89%;\n  --ac: 310 100% 90%;\n  --nc: 217 100% 82%;\n  --inc: 192 100% 16%;\n  --suc: 182 100% 13%;\n  --wac: 32 100% 17%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 247 47% 43%;\n  --a: 310 49% 52%;\n  --n: 217 92% 10%;\n  --b1: 0 0% 100%;\n  --b2: 217 100% 97%;\n  --b3: 219 44% 92%;\n  --bc: 214 30% 32%;\n  --in: 192 93% 78%;\n  --su: 182 47% 66%;\n  --wa: 32 62% 84%;\n  --er: 0 63% 72%;\n}\n\n*, ::before, ::after {\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}.avatar.placeholder > div {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}.btn {\n  display: inline-flex;\n  flex-shrink: 0;\n  cursor: pointer;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n   -ms-user-select: none;\n       user-select: none;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  border-color: transparent;\n  border-color: hsl(var(--n) / var(--tw-border-opacity));\n  text-align: center;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-btn, 0.5rem);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 1em;\n  min-height: 3rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  text-transform: var(--btn-text-case, uppercase);\n  border-width: var(--border-btn, 1px);\n  -webkit-animation: button-pop var(--animation-btn, 0.25s) ease-out;\n          animation: button-pop var(--animation-btn, 0.25s) ease-out;\n  --tw-border-opacity: 1;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}.btn-disabled, .btn[disabled] {\n  pointer-events: none;\n}.btn.loading, .btn.loading:hover {\n  pointer-events: none;\n}.btn.loading:before {\n  margin-right: 0.5rem;\n  height: 1rem;\n  width: 1rem;\n  border-radius: 9999px;\n  border-width: 2px;\n  -webkit-animation: spin 2s linear infinite;\n          animation: spin 2s linear infinite;\n  content: \"\";\n  border-top-color: transparent;\n  border-left-color: transparent;\n  border-bottom-color: currentColor;\n  border-right-color: currentColor;\n}@media (prefers-reduced-motion: reduce) {\n\n  .btn.loading:before {\n    -webkit-animation: spin 10s linear infinite;\n            animation: spin 10s linear infinite;\n  }\n}@-webkit-keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}@keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}.btn-group > input[type=\"radio\"].btn {\n  -webkit-appearance: none;\n  -moz-appearance: none;\n       appearance: none;\n}.btn-group > input[type=\"radio\"].btn:before {\n  content: attr(data-title);\n}.input {\n  flex-shrink: 1;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 2;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  border-radius: var(--rounded-btn, 0.5rem);\n}.input-group > *, .input-group > .input {\n  border-radius: 0px;\n}.link {\n  cursor: pointer;\n  -webkit-text-decoration-line: underline;\n  text-decoration-line: underline;\n}.btn-outline.btn-primary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}.btn-outline.btn-primary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}.btn-outline.btn-primary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}.btn-outline.btn-primary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}.btn:active:hover,\n  .btn:active:focus {\n  -webkit-animation: none;\n          animation: none;\n  transform: scale(var(--btn-focus-scale, 0.95));\n}.btn:hover, .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--nf, var(--n)) / var(--tw-bg-opacity));\n}.btn:focus-visible {\n  outline: 2px solid hsl(var(--nf));\n  outline-offset: 2px;\n}.btn-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}.btn-primary:hover, .btn-primary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n}.btn-primary:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}.btn.glass:hover,\n    .btn.glass.btn-active {\n  --glass-opacity: 25%;\n  --glass-border-opacity: 15%;\n}.btn.glass:focus-visible {\n  outline: 2px solid 0 0 2px currentColor;\n}.btn-outline.btn-primary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}.btn-outline.btn-primary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}.btn-disabled, .btn-disabled:hover, .btn[disabled], .btn[disabled]:hover {\n  --tw-border-opacity: 0;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.2;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}.btn.loading.btn-square:before, .btn.loading.btn-circle:before {\n  margin-right: 0px;\n}.btn.loading.btn-xl:before, .btn.loading.btn-lg:before {\n  height: 1.25rem;\n  width: 1.25rem;\n}.btn.loading.btn-sm:before, .btn.loading.btn-xs:before {\n  height: 0.75rem;\n  width: 0.75rem;\n}.btn-group > input[type=\"radio\"]:checked.btn, .btn-group > .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}.btn-group > input[type=\"radio\"]:checked.btn:focus-visible, .btn-group > .btn-active:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}.btn-group > .btn:not(:first-of-type) {\n  margin-left: -1px;\n  border-top-left-radius: 0px;\n  border-bottom-left-radius: 0px;\n}.btn-group > .btn:not(:last-of-type) {\n  border-top-right-radius: 0px;\n  border-bottom-right-radius: 0px;\n}@-webkit-keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}@keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}@-webkit-keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}@keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-primary {\n  outline: 2px solid hsl(var(--p));\n}.input:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}.input-disabled, .input[disabled] {\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}.input-disabled::-moz-placeholder, .input[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}.input-disabled:-ms-input-placeholder, .input[disabled]:-ms-input-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}.input-disabled::placeholder, .input[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}.link:focus {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}.link:focus-visible {\n  outline: 2px solid currentColor;\n  outline-offset: 2px;\n}.mockup-phone .display {\n  overflow: hidden;\n  border-radius: 40px;\n  margin-top: -25px;\n}@-webkit-keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}@keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}@-webkit-keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}@keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}@-webkit-keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}@keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}.hidden {\n  display: none;\n}.transform {\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}.border {\n  border-width: 1px;\n}";
    styleInject(css_248z);

    /* src/App.svelte generated by Svelte v3.38.2 */

    function create_fragment(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const routes = {
    		"/": wrap$1({ component: Connect }),
    		"/n": wrap$1({ component: Nomination })
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		wrap: wrap$1,
    		Nomination,
    		Connect,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
