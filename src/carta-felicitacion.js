(function(){
  var stage = document.getElementById('stage');
  var frame = document.getElementById('stageFrame');
  var actions = document.getElementById('actions');
  var closeBtn = document.getElementById('closeBtn');
  var downloadBtn = document.getElementById('downloadBtn');
  var statusEl = document.getElementById('status');
  var letterCard = document.getElementById('letterCard');
  var letterContent = document.getElementById('letterContent');
  var opened = false;

  function openEnvelope(){
    if (opened) return;
    opened = true;
    stage.classList.add('is-open');
    frame.setAttribute('aria-expanded', 'true');
    var onEnd = function(e){
      if (e.target !== document.querySelector('.letter-slot')) return;
    };
    // Reveal the action buttons once the letter has settled.
    window.setTimeout(function(){
      actions.classList.add('revealed');
    }, 650);
  }

  function closeEnvelope(){
    opened = false;
    stage.classList.remove('is-open');
    frame.setAttribute('aria-expanded', 'false');
    actions.classList.remove('revealed');
    statusEl.textContent = '';
  }

  frame.addEventListener('click', function(){
    if (!opened) openEnvelope();
  });
  frame.addEventListener('keydown', function(e){
    if ((e.key === 'Enter' || e.key === ' ') && !opened){
      e.preventDefault();
      openEnvelope();
    }
  });
  closeBtn.addEventListener('click', function(e){
    e.stopPropagation();
    closeEnvelope();
  });

  async function downloadPdf(){
    downloadBtn.disabled = true;
    statusEl.textContent = 'Generando PDF…';

    letterContent.classList.add('pdf-render');
    letterCard.style.height = 'auto';

    try {
      var canvas = await window.html2canvas(letterContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // Size the PDF page to the content itself so everything fits on a
      // single page, no matter how long the letter text ends up being.
      var marginMM = 10;
      var pageWidthMM = 216; // US Letter width
      var contentWidthMM = pageWidthMM - marginMM * 2;
      var contentHeightMM = canvas.height * contentWidthMM / canvas.width;
      var pageHeightMM = contentHeightMM + marginMM * 2;

      var JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
      var pdf = new JsPDF({
        unit: 'mm',
        format: [pageWidthMM, pageHeightMM],
        orientation: 'portrait'
      });

      var imgData = canvas.toDataURL('image/jpeg', 0.97);
      pdf.addImage(imgData, 'JPEG', marginMM, marginMM, contentWidthMM, contentHeightMM);
      var blob = pdf.output('blob');

      var downloads = (window.claude && typeof window.claude.use === 'function')
        ? await window.claude.use('downloads')
        : null;

      if (downloads){
        var result = await downloads.save({ filename: 'carta-felicitacion.pdf', data: blob });
        statusEl.textContent = result && result.status === 'saved'
          ? 'PDF guardado.'
          : 'PDF listo.';
      } else {
        // Fallback for contexts without the downloads capability (e.g. a plain HTML file).
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'carta-felicitacion.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        statusEl.textContent = 'PDF listo.';
      }
    } catch (err){
      statusEl.textContent = 'No se pudo generar el PDF. Intenta de nuevo.';
    } finally {
      letterContent.classList.remove('pdf-render');
      letterCard.style.height = '';
      downloadBtn.disabled = false;
    }
  }

  downloadBtn.addEventListener('click', function(e){
    e.stopPropagation();
    downloadPdf();
  });
})();