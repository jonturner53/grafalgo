IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-util.a ${LDIR}/lib-ds.a

CXXFLAGS = -O2 -m64 

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : testUiList testUiDlist testIdMap testUiClist testUiSetPair testPartition

testUiList: testUiList.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testUiDlist: testUiDlist.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testIdMap: testIdMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testUiClist: testUiClist.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testUiSetPair: testUiSetPair.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testPartition: testPartition.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
