export function KotsuBee({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" aria-hidden>
      <defs>
        <linearGradient
          id="kotsu-bee-wing-left"
          x1=".14"
          y1=".02"
          x2=".84"
          y2="1"
        >
          <stop stopColor="#f0e2ff" />
          <stop offset=".55" stopColor="#dcc8fb" />
          <stop offset="1" stopColor="#bba4f6" />
        </linearGradient>
        <linearGradient
          id="kotsu-bee-wing-right"
          x1=".12"
          y1="0"
          x2=".86"
          y2="1"
        >
          <stop stopColor="#f2e7ff" />
          <stop offset="1" stopColor="#d3b9fa" />
        </linearGradient>
        <linearGradient id="kotsu-bee-stripes" x1="0" y1=".08" x2="1" y2=".88">
          <stop stopColor="#805ef3" />
          <stop offset="1" stopColor="#6548dd" />
        </linearGradient>
        <linearGradient id="kotsu-bee-band" x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#f2e4ff" />
          <stop offset="1" stopColor="#ddcafa" />
        </linearGradient>
        <radialGradient id="kotsu-bee-face" cx=".66" cy=".5" r=".72">
          <stop stopColor="#fbf1ff" />
          <stop offset=".78" stopColor="#f0dff9" />
          <stop offset="1" stopColor="#dcc4f5" />
        </radialGradient>
        <clipPath id="kotsu-bee-body">
          <path d="M243 770C253 687 326 623 438 581C532 543 652 536 765 536C901 536 997 635 1001 772C1008 900 938 981 816 1020C697 1058 543 1047 424 1009C306 973 228 877 243 770Z" />
        </clipPath>
      </defs>
      <g transform="translate(-28 -70) scale(.9)">
        <path
          fill="url(#kotsu-bee-wing-right)"
          d="M524 392C552 319 609 268 675 268C734 262 786 302 805 361C830 443 766 529 674 563C616 584 551 553 526 487C510 448 510 426 524 392Z"
        />
        <path
          fill="url(#kotsu-bee-wing-left)"
          d="M198 374C222 293 293 252 379 253C483 248 561 332 591 431C609 490 606 548 584 563C524 610 444 635 377 623C270 604 191 519 195 419C195 403 196 389 198 374Z"
        />
        <g fill="none" stroke="#7151e6" strokeLinecap="round" strokeWidth={43}>
          <path d="M725 600C726 520 747 490 785 452" />
          <path d="M858 600C871 520 900 488 940 460" />
        </g>
        <g fill="#7151e6">
          <circle cx="785" cy="450" r="48" />
          <circle cx="940" cy="460" r="48" />
        </g>
        <g clipPath="url(#kotsu-bee-body)">
          <path
            fill="url(#kotsu-bee-stripes)"
            d="M200 500L800 500C698 520 620 600 592 700C570 790 570 900 626 988C652 1028 686 1060 730 1090L200 1090Z"
          />
          <path
            fill="url(#kotsu-bee-band)"
            d="M452 500C356 590 302 700 306 820C310 940 376 1030 470 1090L556 1090C452 1020 392 940 372 840C350 720 412 600 532 500Z"
          />
          <path
            fill="url(#kotsu-bee-face)"
            d="M770 500C668 520 590 600 562 700C540 790 540 900 596 988C622 1028 656 1060 700 1090L1040 1090L1040 500Z"
          />
        </g>
        <g fill="none" stroke="#6845cf" strokeLinecap="round" strokeWidth={30}>
          <path d="M687 729C711 771 751 768 781 728" />
          <path d="M870 727C894 766 923 762 948 725" />
        </g>
      </g>
    </svg>
  );
}
