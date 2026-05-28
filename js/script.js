// ===================================
// VOZ ATIVA - JAVASCRIPT PRINCIPAL
// ===================================

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

document.addEventListener('click', function(event) {
    const menu = document.getElementById('mobileMenu');
    const menuBtn = document.querySelector('.mobile-menu-btn');

    if (menu && menuBtn) {
        if (!menu.contains(event.target) && !menuBtn.contains(event.target)) {
            menu.classList.remove('active');
        }
    }
});


document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

function fadeInOnScroll() {
    const elements = document.querySelectorAll('.card, .grid > div');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fadeInOnScroll);
} else {
    fadeInOnScroll();
}

// Validação de formulários
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\d\s\(\)\-\+]+$/;
    return re.test(phone);
}

function maskPhone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    }
    input.value = value;
}

// Aplicar máscara de telefone em inputs
document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', function() {
        maskPhone(this);
    });
});

// Mensagem de confirmação ao sair da página com formulário preenchido
let formChanged = false;

document.querySelectorAll('form input, form textarea, form select').forEach(element => {
    element.addEventListener('change', function() {
        formChanged = true;
    });
});

window.addEventListener('beforeunload', function(e) {
    if (formChanged) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
        return e.returnValue;
    }
});

// Resetar flag quando formulário é enviado
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function() {
        formChanged = false;
    });
});

// Copiar texto (para protocolos de denúncia)
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        alert('Copiado para a área de transferência!');
    }, function(err) {
        console.error('Erro ao copiar:', err);
    });
}

// Contador de caracteres para textarea
document.querySelectorAll('textarea[maxlength]').forEach(textarea => {
    const maxLength = textarea.getAttribute('maxlength');
    const counter = document.createElement('div');
    counter.style.cssText = 'text-align: right; font-size: 0.875rem; color: var(--gray-600); margin-top: 0.5rem;';
    counter.textContent = `0/${maxLength}`;

    if (textarea.parentNode) {
        textarea.parentNode.insertBefore(counter, textarea.nextSibling);
    }

    textarea.addEventListener('input', function() {
        counter.textContent = `${this.value.length}/${maxLength}`;

        if (this.value.length >= maxLength * 0.9) {
            counter.style.color = 'var(--red-600)';
        } else {
            counter.style.color = 'var(--gray-600)';
        }
    });
});

// Confirmar ações destrutivas
document.querySelectorAll('[data-confirm]').forEach(element => {
    element.addEventListener('click', function(e) {
        const message = this.getAttribute('data-confirm');
        if (!confirm(message)) {
            e.preventDefault();
        }
    });
});

// Tooltip simples
function showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: var(--gray-900);
        color: var(--white);
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        z-index: 9999;
        pointer-events: none;
        white-space: nowrap;
    `;

    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
    tooltip.style.left = (rect.left + (rect.width - tooltip.offsetWidth) / 2) + 'px';

    return tooltip;
}

// Aplicar tooltips em elementos com data-tooltip
document.querySelectorAll('[data-tooltip]').forEach(element => {
    let tooltip = null;

    element.addEventListener('mouseenter', function() {
        const text = this.getAttribute('data-tooltip');
        tooltip = showTooltip(this, text);
    });

    element.addEventListener('mouseleave', function() {
        if (tooltip) {
            tooltip.remove();
            tooltip = null;
        }
    });
});

// ===================================
// BUSCAR DENÚNCIAS (ADMIN)
// ===================================

async function buscarDenunciasAdmin() {

    const tabela = document.getElementById('listaDenuncias');

    // evita erro se não estiver na página admin
    if (!tabela) return;

    try {

        const resposta = await fetch(
            'http://localhost:3000/api/admin/denuncias'
        );

        const denuncias = await resposta.json();

        tabela.innerHTML = '';

        denuncias.forEach(denuncia => {

            tabela.innerHTML += `
                <tr>
                    <td>${denuncia.id_denuncia}</td>

                    <td>
                        ${denuncia.usuario || 'Anônimo'}
                    </td>

                    <td>
                        ${denuncia.nome_tipo || '-'}
                    </td>

                    <td>
                        ${denuncia.titulo || '-'}
                    </td>

                    <td>
                        <span class="badge ${denuncia.status_denuncia}">
                            ${denuncia.status_denuncia}
                        </span>
                    </td>

                    <td>
                        ${denuncia.prioridade}
                    </td>

                    <td>
                        <button
                            onclick="verDenuncia(${denuncia.id_denuncia})"
                            class="btn btn-purple"
                        >
                            Ver
                        </button>
                    </td>
                </tr>
            `;
        });

        console.log(
            'Denúncias carregadas:',
            denuncias
        );

    } catch (erro) {

        console.error(
            'Erro ao buscar denúncias:',
            erro
        );
    }
}


// ===================================
// VER DETALHES DA DENÚNCIA
// ===================================

async function verDenuncia(id) {

    try {

        const resposta = await fetch(
            `http://localhost:3000/api/admin/denuncias/${id}`
        );

        const denuncia = await resposta.json();

        alert(`
Usuário: ${denuncia.usuario}
Tipo: ${denuncia.nome_tipo}
Descrição: ${denuncia.descricao}
Status: ${denuncia.status_denuncia}
Prioridade: ${denuncia.prioridade}
Local: ${denuncia.local_ocorrido || '-'}
        `);

    } catch (erro) {

        console.error(
            'Erro ao carregar denúncia:',
            erro
        );
    }
}

// ===================================
// INICIAR
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    buscarDenunciasAdmin();
});

// Log para debug
console.log('Voz Ativa - Sistema carregado com sucesso!');
