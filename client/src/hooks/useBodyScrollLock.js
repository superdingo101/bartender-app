import { useEffect } from 'react';

let lockCount = 0;
let savedStyles = null;
let savedScrollY = 0;

const useBodyScrollLock = (locked = true) => {
  useEffect(() => {
    if (!locked || typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const { body, documentElement } = document;

    if (lockCount === 0) {
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      savedStyles = {
        bodyOverflow: body.style.overflow,
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyWidth: body.style.width,
        documentOverflow: documentElement.style.overflow,
      };

      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = `-${savedScrollY}px`;
      body.style.width = '100%';
      documentElement.style.overflow = 'hidden';
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(lockCount - 1, 0);

      if (lockCount === 0 && savedStyles) {
        body.style.overflow = savedStyles.bodyOverflow;
        body.style.position = savedStyles.bodyPosition;
        body.style.top = savedStyles.bodyTop;
        body.style.width = savedStyles.bodyWidth;
        documentElement.style.overflow = savedStyles.documentOverflow;
        window.scrollTo(0, savedScrollY);
        savedStyles = null;
        savedScrollY = 0;
      }
    };
  }, [locked]);
};

export default useBodyScrollLock;
