import { useEffect } from 'react';

function useTitle(title) {

  useEffect(() => {
    const prevTitle = document.title;
    document.title = prevTitle + ' | ' + title;

    return () => {
      document.title = prevTitle;
    };
  });

}

export default useTitle