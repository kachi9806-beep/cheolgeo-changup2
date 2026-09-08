// 365철거 랜딩 — 스크롤 리빌과 플로팅 전화 CTA
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var page = document.querySelector(".page");
  if (!page) return;

  var singles = page.querySelectorAll(
    ".hero__eyebrow, .hero__badge, .hero__title, .hero__sub, .hero__art," +
    " .kicker, .h2, .sub, .cta, .cta__note, .fund__art, .fund__notice," +
    " .final__tel, .chevron, .slider"
  );
  var i;
  for (i = 0; i < singles.length; i++) singles[i].classList.add("reveal");

  var groups = page.querySelectorAll(".types, .fixes, .wcards");
  for (i = 0; i < groups.length; i++) {
    var kids = groups[i].children, j;
    for (j = 0; j < kids.length; j++) {
      kids[j].classList.add("reveal");
      kids[j].style.transitionDelay = (j * 90) + "ms";
    }
  }

  var targets = page.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    for (i = 0; i < targets.length; i++) targets[i].classList.add("in");
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    for (i = 0; i < targets.length; i++) io.observe(targets[i]);
  }

  // 플로팅 CTA: 히어로를 지나면 노출, 마지막 섹션에 닿으면 숨김
  var fab = document.getElementById("fab");
  var hero = document.querySelector(".hero");
  var finalSec = document.querySelector(".final");
  if (!fab || !hero || !finalSec) return;

  if (!("IntersectionObserver" in window)) {
    window.addEventListener("scroll", function () {
      var y = window.pageYOffset, vh = window.innerHeight;
      var bottom = document.body.scrollHeight - (y + vh);
      fab.classList.toggle("show", y > vh * 0.8 && bottom > 220);
    }, { passive: true });
    return;
  }

  var pastTop = false, nearBottom = false;
  function update() { fab.classList.toggle("show", pastTop && !nearBottom); }

  new IntersectionObserver(function (e) {
    pastTop = !e[0].isIntersecting; update();
  }, { threshold: 0 }).observe(hero);

  new IntersectionObserver(function (e) {
    nearBottom = e[0].isIntersecting; update();
  }, { threshold: 0, rootMargin: "0px 0px -6% 0px" }).observe(finalSec);
})();

// 사례 슬라이드: 자동 넘김 + 스와이프 + 화살표 + 점
(function caseSlider() {
  "use strict";

  var slider = document.getElementById("caseSlider");
  var track = document.getElementById("caseTrack");
  var dotsBox = document.getElementById("caseDots");
  if (!slider || !track || !dotsBox) return;

  var slides = track.children;
  var n = slides.length;
  if (n < 2) return;

  var prev = slider.querySelector(".slider__arw--prev");
  var next = slider.querySelector(".slider__arw--next");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  var current = 0;
  var timer = null;
  var resumeTimer = null;
  var inView = false;
  var DELAY = 3500;
  var RESUME_AFTER = 6000;

  var dots = [];
  for (var i = 0; i < n; i++) {
    var b = document.createElement("button");
    b.className = "slider__dot";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", (i + 1) + "번째 사진");
    b.setAttribute("aria-selected", i === 0 ? "true" : "false");
    b.dataset.idx = i;
    dotsBox.appendChild(b);
    dots.push(b);
  }

  function paint() {
    for (var k = 0; k < n; k++) {
      dots[k].setAttribute("aria-selected", k === current ? "true" : "false");
    }
  }

  function goTo(idx) {
    var target = (idx + n) % n;
    // 마지막에서 처음으로 돌아갈 때 8칸을 훑고 지나가면 어지럽다. 즉시 이동한다
    var wrapping = Math.abs(target - current) > 1;
    current = target;
    track.scrollTo({
      left: slides[current].offsetLeft,
      behavior: wrapping ? "auto" : "smooth"
    });
    paint();
  }

  function play() {
    if (timer || !inView || reduce.matches || document.hidden) return;
    timer = setInterval(function () { goTo(current + 1); }, DELAY);
  }

  function pause() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  // 손대면 잠시 멈췄다가 다시 돈다. 페이지를 스크롤하다 사진에 손이 닿는 것만으로
  // 영구 정지시키면 대부분의 방문자가 자동 넘김을 한 번도 못 본다
  function pauseAndResume() {
    pause();
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(play, RESUME_AFTER);
  }

  // 스크롤 위치로 현재 인덱스 역산 (스와이프 대응)
  var scrollTick = null;
  track.addEventListener("scroll", function () {
    if (scrollTick) return;
    scrollTick = setTimeout(function () {
      scrollTick = null;
      var idx = Math.round(track.scrollLeft / track.clientWidth);
      if (idx !== current && idx >= 0 && idx < n) { current = idx; paint(); }
    }, 90);
  }, { passive: true });

  dotsBox.addEventListener("click", function (e) {
    var t = e.target;
    if (!t.dataset || t.dataset.idx === undefined) return;
    pauseAndResume();
    goTo(Number(t.dataset.idx));
  });

  prev.addEventListener("click", function () { pauseAndResume(); goTo(current - 1); });
  next.addEventListener("click", function () { pauseAndResume(); goTo(current + 1); });

  // 사진을 직접 만질 때만 멈춘다. wheel 과 keydown 은 페이지 스크롤에도 걸려 제외한다
  track.addEventListener("pointerdown", pauseAndResume, { passive: true });

  // 마우스를 올리면 읽는 중이므로 멈추고, 벗어나면 다시 돈다
  slider.addEventListener("mouseenter", pause);
  slider.addEventListener("mouseleave", play);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause(); else play();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      inView = e[0].isIntersecting;
      if (inView) play(); else pause();
    }, { threshold: 0.35 }).observe(slider);
  } else {
    inView = true;
    play();
  }

  paint();
})();
