import React from "react";

class TestClass extends React.Component {
  render() {
    return <View>
   {someCondition && console.log('test')}      <Text>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>
      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>
      {120}
    </View>;
  }

}