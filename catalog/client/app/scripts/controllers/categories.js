'use strict';

/**
 * @ngdoc function
 * @name itemCatalogApp.controller:CategoriesCtrl
 * @description
 * # CategoriesCtrl
 * Controller of the itemCatalogApp
 */
angular.module('itemCatalogApp')
  .controller('CategoriesCtrl', function ($rootScope, $scope, $stateParams, $location, $state, Category, Common, Profile) {
    $scope.categories = [];
    $scope.categoryFilter = '';
    $scope.action = { 'add': false, 'edit': false, 'view': false };
    $scope.categorySelected = null;

    $scope.addCategory = function () {
      $scope.reset();
      $scope.action.add = true;
      $scope.categorySelected = {};
    };

    $scope.reset = function () {
      $scope.action.add = false;
      $scope.action.edit = false;
      $scope.action.view = false;
      $scope.categorySelected = null;
    };

    var clear = function () {
      $scope.reset();
      $state.go('categories', {}, { notify: false });
    };

    $scope.selectItem = function (item) {
      if (item) {
        $state.go('item', { 'categoryId': $scope.categorySelected.id, 'itemId': item.id }, { notify: true });
      } else {
        $state.go('items', { 'categoryId': $scope.categorySelected.id}, { notify: true });
      }
    };

    $scope.cancel = function () {
      clear();
    };

    $scope.save = function () {
      var category = new Category({ title: $scope.categorySelected.title });
      var promise = $scope.action.edit ? category.$update({categoryId: $scope.categorySelected.id}) : category.$save();

      promise.then(function (response) {
        loadCategories();
        if ($scope.action.add) {
          Common.alert.setSuccessMessage('Category added!');
          $scope.selectCategory(response);
        } else if ($scope.action.edit) {
          Common.alert.setSuccessMessage('Category updated!');
          $scope.reset();
        }
      }, function (response) {
        Common.alert.setErrorMessage(response.data.message);
      });
    };

    $scope.delete = function () {
      var category = new Category();
      category.$delete({ categoryId: $scope.categorySelected.id })
      .then(function (response) {
        clear();
        loadCategories();
        Common.alert.setSuccessMessage('Category removed!');
      }, function (response) {
        Common.alert.setErrorMessage(response.data.message);
      });
    };

    $scope.isCategoryFormVisible = function () {
      return $scope.action.add || $scope.action.edit || $scope.action.view;
    };

    $scope.isOwner = function () {
      if ($rootScope.profile && $scope.categorySelected) {
        return $rootScope.profile.email === $scope.categorySelected.author && $scope.categorySelected.author !== undefined;
      }
      return false;
    };

    $scope.selectCategory = function (category) {
      $scope.reset();
      var isSignedIn = Profile.isSignedIn();
      $scope.action.edit = true && isSignedIn;
      $scope.action.view = !isSignedIn;
      $scope.categorySelected = angular.copy(category);
      $state.go('category', { 'categoryId': category.id }, { notify: false });
    };

    var loadCategories = function () {
      return Category.query(function (response) {
        $scope.categories = response;

        var categoryId = Number.parseInt($stateParams.categoryId);

        if (!Number.isNaN(categoryId)) {
          for (var i = 0, l = response.length; i < l; i++) {
            if (response[i].id === categoryId) {
              $scope.selectCategory(response[i]);
              break;
            }
          }
        }
      }, function (response) {
        Common.alert.setErrorMessage(response.data.message);
      });
    };

    (function init() {
      Common.setTag('categories');
      loadCategories();
    })();
  });
