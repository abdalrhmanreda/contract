// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    setCurrentDate();
    initializeSignaturePads();
    setupEventListeners();
});

// Set current date
function setCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const today = new Date().toLocaleDateString('ar-SA', options);
    dateElement.textContent = today;
}

// Toggle edit mode
let isEditMode = false;
function toggleEditMode() {
    isEditMode = !isEditMode;
    const editableFields = document.querySelectorAll('.editable-field');

    editableFields.forEach(field => {
        if (isEditMode) {
            field.removeAttribute('readonly');
            field.classList.add('editing');
        } else {
            field.setAttribute('readonly', true);
            field.classList.remove('editing');
        }
    });

    // Update button text
    const btn = event.target.closest('button');
    if (isEditMode) {
        btn.innerHTML = '<i class="fas fa-lock"></i> قفل التعديل';
        btn.classList.add('btn-warning');
    } else {
        btn.innerHTML = '<i class="fas fa-edit"></i> وضع التعديل';
        btn.classList.remove('btn-warning');
    }
}

// Calculate payment amounts
function calculatePayments() {
    const totalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;

    const payment1 = (totalAmount * 0.30).toFixed(2);
    const payment2 = (totalAmount * 0.30).toFixed(2);
    const payment3 = (totalAmount * 0.40).toFixed(2);

    document.getElementById('payment1').textContent = payment1.toLocaleString('ar-SA');
    document.getElementById('payment2').textContent = payment2.toLocaleString('ar-SA');
    document.getElementById('payment3').textContent = payment3.toLocaleString('ar-SA');
}

// Signature Pad Implementation
let signaturePads = {};

function initializeSignaturePads() {
    const pads = document.querySelectorAll('.signature-pad');

    pads.forEach((pad, index) => {
        const canvas = pad.querySelector('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = pad.offsetWidth;
        canvas.height = pad.offsetHeight;

        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Touch events for mobile
        canvas.addEventListener('touchstart', handleTouch);
        canvas.addEventListener('touchmove', handleTouch);
        canvas.addEventListener('touchend', stopDrawing);

        function startDrawing(e) {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        }

        function draw(e) {
            if (!isDrawing) return;

            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();

            [lastX, lastY] = [e.offsetX, e.offsetY];
        }

        function stopDrawing() {
            isDrawing = false;
        }

        function handleTouch(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            if (e.type === 'touchstart') {
                isDrawing = true;
                [lastX, lastY] = [x, y];
            } else if (e.type === 'touchmove' && isDrawing) {
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();

                [lastX, lastY] = [x, y];
            }
        }

        signaturePads[index + 1] = { canvas, ctx };
    });
}

function clearSignature(padNumber) {
    const pad = signaturePads[padNumber];
    if (pad) {
        pad.ctx.clearRect(0, 0, pad.canvas.width, pad.canvas.height);
    }
}

// Save contract
function saveContract() {
    const contractData = gatherContractData();

    // Save to localStorage
    localStorage.setItem('contractData', JSON.stringify(contractData));

    showNotification('تم حفظ العقد بنجاح!', 'success');
}

// Gather all contract data
function gatherContractData() {
    const data = {
        timestamp: new Date().toISOString(),
        developer: {},
        client: {},
        terms: {}
    };

    // Gather all input values
    const inputs = document.querySelectorAll('.editable-field');
    inputs.forEach(input => {
        if (input.value) {
            data.terms[input.placeholder || input.type] = input.value;
        }
    });

    return data;
}

// Print contract
function printContract() {
    window.print();
}

// Generate PDF (requires html2pdf library)
function generatePDF() {
    showNotification('جاري إنشاء ملف PDF...', 'info');

    // This is a placeholder - you'll need to include html2pdf.js library
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

    if (typeof html2pdf !== 'undefined') {
        const element = document.querySelector('.contract-container');
        const opt = {
            margin: 10,
            filename: 'عقد-عمل-' + new Date().getTime() + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            showNotification('تم إنشاء ملف PDF بنجاح!', 'success');
        });
    } else {
        alert('لإنشاء PDF، يرجى تضمين مكتبة html2pdf.js');
        window.print(); // Fallback to print
    }
}

// Email contract
function emailContract() {
    const subject = encodeURIComponent('عقد تطوير تطبيقات Flutter');
    const body = encodeURIComponent('مرفق العقد للمراجعة والتوقيع.');

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
        animation: slideDown 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Auto-save on input change
    const inputs = document.querySelectorAll('.editable-field');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            if (isEditMode) {
                saveContract();
            }
        });
    });

    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Add CSS animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Load saved data on page load
window.addEventListener('load', () => {
    const savedData = localStorage.getItem('contractData');
    if (savedData) {
        console.log('تم العثور على بيانات محفوظة');
        // You can restore the data here if needed
    }
}); 