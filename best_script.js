(() => {
	'use strict';

	/**
	 * Text Select & Drag
	 * - Ctrl + drag => marquee selection
	 * - Ctrl + click => toggle selection for char
	 * - Drag selected char => move / swap / float
	 *
	 * HTML/CSS contract (do not change):
	 * #textForm, #textInput, #line, #marquee, #selectedCount
	 * classes: mark-span, is-selected, is-dragging, floating-span, placeholder, drag-ghost
	 */

	const SELECT_TAP_TOLERANCE_PX = 8;

	const qs = (sel, root = document) => root.querySelector(sel);

	const dom = Object.freeze({
		form: qs('#textForm'),
		input: qs('#textInput'),
		line: qs('#line'),
		marquee: qs('#marquee'),
		selectedCount: qs('#selectedCount'),
		body: document.body,
	});

	if (!dom.form || !dom.input || !dom.line || !dom.marquee || !dom.selectedCount) {
		// Fail fast (helps in interviews too)
		throw new Error('Required DOM nodes are missing. Check HTML ids.');
	}

	/** @typedef {{x:number, y:number}} Point */

	const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

	const rectFromPoints = (a, b) => {
		const left = Math.min(a.x, b.x);
		const top = Math.min(a.y, b.y);
		const right = Math.max(a.x, b.x);
		const bottom = Math.max(a.y, b.y);
		return { left, top, right, bottom, width: right - left, height: bottom - top };
	};

	const rectsIntersect = (r1, r2) =>
		r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top;

	const createSpanHTML = (text) =>
		[...text].map((ch, i) => `<span class="mark-span" id="sp-${i}">${escapeHtml(ch)}</span>`).join('');

	function escapeHtml(str) {
		// Prevent accidental HTML injection in tasks (good practice)
		return String(str)
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#039;');
	}

	function setSelected(el, value) {
		el.classList.toggle('is-selected', Boolean(value));
	}

	function toggleSelected(el) {
		el.classList.toggle('is-selected');
	}

	function isSelected(el) {
		return el.classList.contains('is-selected');
	}

	function isLineChar(el) {
		return el?.classList?.contains('mark-span') && !el.classList.contains('placeholder');
	}

	function isPlaceholder(el) {
		return el?.classList?.contains('placeholder') && el?.dataset?.placeholder === 'true';
	}

	function isFloating(el) {
		return el?.classList?.contains('floating-span');
	}

	function closestCharTarget(node) {
		return node?.closest?.('span.mark-span, span.floating-span') ?? null;
	}

	function createPlaceholderLike(span) {
		const ph = document.createElement('span');
		ph.classList.add('mark-span', 'placeholder');
		ph.dataset.placeholder = 'true';
		// keep selection style parity (optional)
		if (span.classList.contains('is-selected')) ph.classList.add('is-selected');
		// keep some size using content (optional), but empty is fine
		ph.textContent = '';
		return ph;
	}

	function swapNodes(a, b) {
		if (!a || !b || a === b) return false;
		const aParent = a.parentNode;
		const bParent = b.parentNode;
		if (!aParent || !bParent) return false;

		const aMarker = document.createComment('swap-a');
		const bMarker = document.createComment('swap-b');

		aParent.insertBefore(aMarker, a);
		bParent.insertBefore(bMarker, b);

		aParent.replaceChild(b, aMarker);
		bParent.replaceChild(a, bMarker);

		return true;
	}

	function updateSelectedCounter() {
		const selected = dom.line.querySelectorAll('.is-selected').length + document.querySelectorAll('.floating-span.is-selected').length;
		dom.selectedCount.textContent = String(selected);
	}

	const state = {
		// Selection mode
		selecting: {
			active: false,
			start: /** @type {Point|null} */ (null),
			rafId: 0,
			lastPoint: /** @type {Point|null} */ (null),
		},

		// Drag mode
		drag: {
			active: false,
			draggedEl: /** @type {HTMLElement|null} */ (null),
			ghostEl: /** @type {HTMLElement|null} */ (null),
			sourcePlaceholder: /** @type {HTMLElement|null} */ (null),
			startedFromLine: false,
		},
	};

	// ---------- Render ----------
	function renderTextLine(text) {
		dom.line.innerHTML = createSpanHTML(text);
		updateSelectedCounter();
	}

	// ---------- Selection (Ctrl + drag / Ctrl + click) ----------
	function beginSelection(point) {
		state.selecting.active = true;
		state.selecting.start = point;
		state.selecting.lastPoint = point;

		dom.marquee.classList.add('is-drawing');
		applyMarqueeRect(rectFromPoints(point, point));
	}

	function applyMarqueeRect(r) {
		// fixed positioned marquee
		dom.marquee.style.left = `${r.left}px`;
		dom.marquee.style.top = `${r.top}px`;
		dom.marquee.style.width = `${r.width}px`;
		dom.marquee.style.height = `${r.height}px`;
	}

	function endSelection(endPoint, originalEventTarget) {
		const start = state.selecting.start;
		if (!start) return;

		const r = rectFromPoints(start, endPoint);

		// cleanup marquee visuals
		dom.marquee.classList.remove('is-drawing');
		dom.marquee.style.left = '0px';
		dom.marquee.style.top = '0px';
		dom.marquee.style.width = '0px';
		dom.marquee.style.height = '0px';

		const isClick = r.width <= SELECT_TAP_TOLERANCE_PX && r.height <= SELECT_TAP_TOLERANCE_PX;

		if (isClick) {
			// Ctrl + click toggles only the clicked char (if any)
			const el = closestCharTarget(originalEventTarget);
			if (el) toggleSelected(el);
		} else {
			// Rect selection affects only chars inside the line (not floating ones)
			const chars = dom.line.querySelectorAll('span.mark-span:not(.placeholder)');
			for (const el of chars) {
				const br = el.getBoundingClientRect();
				const elRect = { left: br.left, top: br.top, right: br.right, bottom: br.bottom };
				if (rectsIntersect(r, elRect)) setSelected(el, true);
			}
		}

		updateSelectedCounter();
	}

	// ---------- Drag ----------
	function beginDrag(dragEl, startPoint) {
		state.drag.active = true;
		state.drag.draggedEl = dragEl;
		state.drag.startedFromLine = isLineChar(dragEl);

		// If dragging from line => we leave a placeholder "hole"
		if (state.drag.startedFromLine) {
			const ph = createPlaceholderLike(dragEl);
			dragEl.replaceWith(ph);
			state.drag.sourcePlaceholder = ph;
		} else {
			state.drag.sourcePlaceholder = null;
		}

		dragEl.classList.add('is-dragging');

		const ghost = document.createElement('div');
		ghost.className = 'drag-ghost';
		ghost.textContent = dragEl.textContent ?? '';
		dom.body.append(ghost);
		state.drag.ghostEl = ghost;

		moveGhostTo(startPoint);
	}

	function moveGhostTo(point) {
		if (!state.drag.ghostEl) return;
		state.drag.ghostEl.style.left = `${point.x}px`;
		state.drag.ghostEl.style.top = `${point.y}px`;
	}

	function endDrag(dropPoint) {
		const dragEl = state.drag.draggedEl;
		if (!dragEl) return;

		// cleanup ghost + dragging style
		if (state.drag.ghostEl) state.drag.ghostEl.remove();
		state.drag.ghostEl = null;
		dragEl.classList.remove('is-dragging');

		// Determine drop target
		const pointerNode = document.elementFromPoint(dropPoint.x, dropPoint.y);
		const dropChar = pointerNode?.closest?.('span.mark-span') ?? null;

		// Helper: convert floating -> inline char (mark-span)
		const ensureInline = (el) => {
			if (!isFloating(el)) return;
			el.classList.remove('floating-span');
			el.style.position = '';
			el.style.left = '';
			el.style.top = '';
			el.classList.add('mark-span');
		};

		// Case 1: dropped into placeholder
		if (dropChar && isPlaceholder(dropChar)) {
			ensureInline(dragEl);
			dropChar.replaceWith(dragEl);
			cleanupDragState();
			updateSelectedCounter();
			return;
		}

		// Case 2: dropped onto another char in line => swap logic
		if (dropChar && dropChar !== dragEl) {
			if (state.drag.startedFromLine && state.drag.sourcePlaceholder) {
				// Swap: dragged (from line) with dropChar, and close the hole by moving dropChar into placeholder
				// Flow:
				// - placeholder currently in line where dragged was
				// - dropChar currently in line at its position
				// After drop:
				// - dragged should go where dropChar was
				// - dropChar should go into placeholder
				const marker = document.createComment('drop-marker');
				dropChar.before(marker);

				state.drag.sourcePlaceholder.replaceWith(dropChar);
				marker.replaceWith(dragEl);

				cleanupDragState();
				updateSelectedCounter();
				return;
			}

			// Floating dropped onto line char: convert to inline and swap
			ensureInline(dragEl);
			swapNodes(dropChar, dragEl);

			cleanupDragState();
			updateSelectedCounter();
			return;
		}

		// Case 3: dropped into empty space => float / move
		if (state.drag.startedFromLine) {
			// Make dragged element floating and append to body (because it's not in DOM now)
			dragEl.classList.remove('mark-span');
			dragEl.classList.add('floating-span');
			dragEl.style.position = 'fixed';
			dragEl.style.left = `${dropPoint.x}px`;
			dragEl.style.top = `${dropPoint.y}px`;

			dom.body.append(dragEl);

			// NOTE: placeholder remains in line as "hole" by task behavior
		} else {
			// just move existing floating
			dragEl.style.position = 'fixed';
			dragEl.style.left = `${dropPoint.x}px`;
			dragEl.style.top = `${dropPoint.y}px`;
		}

		cleanupDragState();
		updateSelectedCounter();
	}

	function cleanupDragState() {
		state.drag.active = false;
		state.drag.draggedEl = null;
		state.drag.startedFromLine = false;
		state.drag.sourcePlaceholder = null;
	}

	// ---------- Event handlers ----------
	function onSubmit(e) {
		e.preventDefault();
		const text = dom.input.value.trim();
		renderTextLine(text);
		dom.form.reset();
	}

	function onPointerDown(e) {
		// Only left mouse / primary pointer
		if (e.button !== 0) return;

		const point = { x: e.clientX, y: e.clientY };

		if (e.ctrlKey) {
			// Selection mode (Ctrl + drag / Ctrl + click)
			beginSelection(point);
			return;
		}

		// Drag mode without Ctrl
		const target = closestCharTarget(e.target);
		if (!target) return;

		// We allow drag only if the target is selected (matches your current UX)
		if (!isSelected(target)) return;

		// prevent text selection / native drag
		e.preventDefault();

		beginDrag(target, point);
	}

	function onPointerMove(e) {
		const point = { x: e.clientX, y: e.clientY };

		// Drag ghost follows pointer
		if (state.drag.active) {
			moveGhostTo(point);
			return;
		}

		// Selection marquee updates (throttled by rAF)
		if (!state.selecting.active || !state.selecting.start) return;

		state.selecting.lastPoint = point;
		if (state.selecting.rafId) return;

		state.selecting.rafId = requestAnimationFrame(() => {
			state.selecting.rafId = 0;
			const start = state.selecting.start;
			const last = state.selecting.lastPoint ?? start;
			applyMarqueeRect(rectFromPoints(start, last));
		});
	}

	function onPointerUp(e) {
		const point = { x: e.clientX, y: e.clientY };

		if (state.selecting.active) {
			endSelection(point, e.target);
			state.selecting.active = false;
			state.selecting.start = null;
			state.selecting.lastPoint = null;
			if (state.selecting.rafId) cancelAnimationFrame(state.selecting.rafId);
			state.selecting.rafId = 0;
			return;
		}

		if (state.drag.active) {
			endDrag(point);
			return;
		}
	}

	// ---------- Init ----------
	dom.form.addEventListener('submit', onSubmit);
	document.addEventListener('pointerdown', onPointerDown);
	document.addEventListener('pointermove', onPointerMove);
	document.addEventListener('pointerup', onPointerUp);

	// Optional: initial render (keeps empty by default)
	updateSelectedCounter();
})();
