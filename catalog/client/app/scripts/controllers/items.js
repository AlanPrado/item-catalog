'use strict';

/**
 * @ngdoc function
 * @name itemCatalogApp.controller:ItemsCtrl
 * @description
 * # ItemsCtrl
 * Controller of the itemCatalogApp
 */
angular.module('itemCatalogApp')
  .controller('ItemsCtrl', function ($scope, $stateParams, $state, Item, Common, Profile, $rootScope) {
    $scope.action = { 'add': false, 'edit': false, 'view': false };
    $scope.itemSelected = null;
    $scope.category = null;

    $scope.addItem = function () {
      $scope.reset();
      $scope.action.add = true;
      $scope.itemSelected = {};
    };

    $scope.isItemFormVisible = function () {
      return $scope.action.add || $scope.action.edit || $scope.action.view;
    };

    $scope.reset = function () {
      $scope.action.add = false;
      $scope.action.edit = false;
      $scope.action.view = false;
      $scope.itemSelected = null;
    };

    var clear = function () {
      $scope.reset();
      $state.go('items', { 'categoryId': $scope.category.id }, { notify: false });
    };

    $scope.cancel = function () {
      clear();
    };

    $scope.selectItem = function (item) {
      $scope.reset();
      var isSignedIn = Profile.isSignedIn();
      $scope.action.edit = true  && isSignedIn;
      $scope.action.view = !isSignedIn;
      $scope.itemSelected = angular.copy(item);
      $state.go('item', { 'categoryId': $stateParams.categoryId, 'itemId': item.id }, { notify: false });
    };

    $scope.save = function () {
      var item = new Item({ categoryId: $scope.category.id,
                            title: $scope.itemSelected.title,
                            description: $scope.itemSelected.description || null });
      var promise = $scope.action.edit
          ? item.$update({ itemId: $scope.itemSelected.id, categoryId: $scope.category.id })
          : item.$save({ categoryId: $scope.category.id });

      var editing = $scope.action.edit;

      promise.then(function (response) {
        loadItemsByCategory(response.categoryId, response.id, editing);

        if (editing) {
          Common.alert.setSuccessMessage('Item updated!');
        } else {
          Common.alert.setSuccessMessage('Item added!');
          $scope.selectItem(response);
        }
      }, function (response) {
        Common.alert.setErrorMessage(response.data.message);
      });
    };

    $scope.isOwner = function () {
      if ($rootScope.profile && $scope.category) {
        return $rootScope.profile.email === $scope.category.author;
      }
      return false;
    };

    $scope.delete = function () {
      var item = new Item();
      item.$delete({ itemId: $scope.itemSelected.id, categoryId: $scope.category.id })
      .then(function (response) {
        clear();
        loadItemsByCategory($scope.category.id, undefined, true);
        Common.alert.setSuccessMessage('Category removed!');
      }, function (response) {
        Common.alert.setErrorMessage(response.data.message);
      });
    };

    var loadItemsByCategory = function (categoryId, itemId, reset) {
      var adding = itemId === undefined;
      return Item.query({categoryId: categoryId},
        function (response) {
          $scope.category = response;
          if (reset) {
            $scope.action.add = false;
            $scope.action.edit = false;
            $scope.action.view = false;
          } else {
            var isSignedIn = Profile.isSignedIn()
            $scope.action.add = adding && isSignedIn;
            $scope.action.edit = !adding && isSignedIn;
            $scope.action.view = !isSignedIn;
          }

          if (!$scope.action.add) {
            var items = response.items;
            var id = Number.parseInt(itemId);
            for (var i = 0, l = items.length; i < l; i++) {
              if (items[i].id === id) {
                $scope.selectItem(items[i]);
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
      loadItemsByCategory($stateParams.categoryId, $stateParams.itemId);
    })();
  });
