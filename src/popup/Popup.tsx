import React, { useEffect } from 'react';

const Popup = () => {
  document.body.className = 'w-[30rem] min-h-[20rem] p-4';

  const [openaiApiKey, setOpenaiApiKey] = React.useState('');
  const [toxicExamples, setToxicExamples] = React.useState('');

  useEffect(() => {
    chrome.storage.local.get(['openaiApiKey', 'toxicExamples']).then((items) => {
      setOpenaiApiKey(items.openaiApiKey);
      setToxicExamples(items.toxicExamples);
    });
  }, []);

  return (
    <>
      <div className="flex justify-center mt-2 text-base">nyaXtension</div>
      <form
        className="flex flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          // get the value of the input
          const openaiApiKey = e.target[0].value;
          chrome.storage.local
            .set({ openaiApiKey: openaiApiKey })
            .then(() => {
              console.log('Saved OpenAI secret key');
              // alert('Saved' + openaiApiKey);
            })
            .catch((e) => {
              console.error('Error', e);
            });
        }}
      >
        <input
          type="text"
          className="w-full h-10 border rounded px-2"
          placeholder="Input OpenAI secret key"
          defaultValue={openaiApiKey}
        />
        <button className="w-16 h-10 rounded bg-blue-500 text-white">Save</button>
      </form>

      {/* separator */}
      <hr className="my-4" />

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          // get the value of the input
          const toxicExamples = e.target[0].value || '';
          chrome.storage.local
            .set({ toxicExamples: toxicExamples.trim() })
            .then(() => {
              console.log('Saved toxic examples');
              // alert('Saved' + toxicExamples);
            })
            .catch((e) => {
              console.error('Error', e);
            });
        }}
      >
        <textarea
          className="w-full h-24 border rounded p-2"
          placeholder="Input prompt to judge the tweet to be converted to cat language"
          defaultValue={toxicExamples}
        />
        <button className="w-full h-10 rounded bg-blue-500 text-white">Save</button>
      </form>
    </>
  );
};

export default Popup;
