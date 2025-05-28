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
      it('Клик по карточке ингредиента открывает модальное окно', () => {
        cy.get(`${bunElement}:first`).click();
        cy.get(MODAL_CONTAINER).children().should('have.length', 2);
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