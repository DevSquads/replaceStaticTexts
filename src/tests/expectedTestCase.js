import React from "react";
import I18n from "../services/internationalizations/i18n";
class TestClass extends React.Component {
  render() {
    return <View title={I18n.t("TestScreen.JSXAttribute.index(0)")}></View>
  }
}