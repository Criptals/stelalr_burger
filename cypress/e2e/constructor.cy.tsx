/// <reference types="cypress" />
import * as orderFixture from '../fixtures/order.json';

const APP_URL = 'http://localhost:4000';
const [bunElement, mainElement, sauceElement] = ['[data-cy="bun"]', '[data-cy="main"]', '[data-cy="sauce"]'];
const ORDER_BUTTON = '[data-cy="order-button"]';
const MODAL_CONTAINER = '#modals';

describe('Тестирование пользовательского интерфейса приложения', () => {
  beforeEach(() => {
    cy.intercept('GET', 'api/ingredients', { fixture: 'ingredients.json' });
    cy.visit(APP_URL);
  });

  it('Проверяем, что список ингредиентов загружается', () => {
    cy.get(bunElement).should('have.length.gte', 1);
    cy.get(`${mainElement}, ${sauceElement}`).should('have.length.gte', 1);
  });

  describe('Тестирование модальных окон с информацией об ингредиентах', () => {
    describe('Открытие модального окна', () => {
      it('Клик по карточке ингредиента открывает модальное окно и отображает корректные данные', () => {
        cy.get('[data-cy="bun"]:first').click();

        cy.get('#modals').children().should('have.length', 2);

        cy.fixture('ingredients').then((fixture) => {
          const ingredients = fixture.data;
          const expectedBun = ingredients.find((item) => item.type === 'bun');

          expect(expectedBun).to.exist;

          cy.get('#modals h3.text_type_main-medium')
            .should('exist')
            .and('have.text', expectedBun.name);
        });
      });

      it('Модалка остаётся после перезагрузки страницы', () => {
        cy.get(`${bunElement}:first`).click();
        cy.reload(true);
        cy.get(MODAL_CONTAINER).children().should('have.length', 2);
      });
    });

    describe('Закрытие модального окна', () => {
      it('Через кнопку закрытия', () => {
        cy.get(`${bunElement}:first`).click();
        cy.get(`${MODAL_CONTAINER} button:first`).click();
        cy.wait(500);
        cy.get(MODAL_CONTAINER).children().should('have.length', 0);
      });

      it('Через клик вне контентной области (оверлей)', () => {
        cy.get(`${bunElement}:first`).click();
        cy.get(`${MODAL_CONTAINER} > div:nth-child(2)`).click({ force: true });
        cy.wait(500);
        cy.get(MODAL_CONTAINER).children().should('have.length', 0);
      });

      it('Через нажатие клавиши Esc', () => {
        cy.get(`${bunElement}:first`).click();
        cy.get('body').type('{esc}');
        cy.wait(500);
        cy.get(MODAL_CONTAINER).children().should('have.length', 0);
      });
    });
  });

  describe('Добавление ингредиента в конструктор бургера', () => {
    it('Пользователь может добавить ингредиент в конструктор и увидеть его там', () => {
      cy.get('[data-cy="main"]:first').as('ingredient');

      cy.fixture('ingredients').then((fixture) => {
        const ingredients = fixture.data;
        const expectedMain = ingredients.find((item) => item.type === 'main');

        expect(expectedMain).to.exist;

        cy.get('@ingredient').find('button').click();

        cy.get('.constructor-element', { timeout: 6000 }).should('exist');
        cy.contains('.constructor-element', expectedMain.name).should('exist');
      });
    });
  });

  describe('Процесс создания заказа', () => {
    beforeEach(() => {
      cy.setCookie('accessToken', 'EXAMPLE_ACCESS_TOKEN');
      localStorage.setItem('refreshToken', 'EXAMPLE_REFRESH_TOKEN');
      cy.intercept('GET', 'api/auth/user', { fixture: 'user.json' });
      cy.intercept('POST', 'api/orders', { fixture: 'order.json' });
      cy.intercept('GET', 'api/ingredients', { fixture: 'ingredients.json' });
      cy.visit(APP_URL);
    });

    it('Пользователь может создать заказ', () => {
      cy.get(ORDER_BUTTON).should('be.disabled');
      cy.get(`${bunElement}:first button`).click();
      cy.get(ORDER_BUTTON).should('be.disabled');
      cy.get(`${mainElement}:first button`).click();
      cy.get(ORDER_BUTTON).should('be.enabled');
      cy.get(ORDER_BUTTON).click();
      cy.get(MODAL_CONTAINER).children().should('have.length', 2);
      cy.get(`${MODAL_CONTAINER} h2:first`).should('have.text', orderFixture.order.number);
      cy.get(ORDER_BUTTON).should('be.disabled');
    });

    afterEach(() => {
      cy.clearCookie('accessToken');
      localStorage.removeItem('refreshToken');
    });
  });
});