// Script for helping download own Packt books from https://account.packtpub.com/account/products

{
  const DEFAULT_CLICK_INTERVAL_MS = 10000;

  const click = element =>
    element.click();

  const delay = milliseconds =>
    new Promise(resolve => setTimeout(resolve, milliseconds));

  const clickInTurn = async (buttons, clickIntervalMs = DEFAULT_CLICK_INTERVAL_MS) => {
    buttons.reduce(async (acc, button) => {
      await acc;
      click(button);
      await delay(clickIntervalMs);
    }, Promise.resolve());
  };

  const findAll = (cssSelector, fromElement = document) =>
    [].slice.call(fromElement.querySelectorAll(cssSelector));

  const downloadAllBooks = () => {
    const pdfDownloadButtons = findAll('.downloads-container button:nth-last-child(2)');
    const codeDownloadButtons = findAll('.downloads-container button:nth-child(1)');

    clickInTurn(pdfDownloadButtons.concat(codeDownloadButtons));
  }

  downloadAllBooks();
}